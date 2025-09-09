// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');
// ⛔️ formatDailyReport 사용 안 함 (alimtalkReport가 타이틀/본문을 생성)
const { sendReportAlimtalk } = require('../utils/alimtalkReport');

const KST = 'Asia/Seoul';
const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';

async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}
function getDailyTplCodeFallback() {
  if (process.env.DAILY_REPORT_TPL_CODE) return process.env.DAILY_REPORT_TPL_CODE;
  return null;
}

/** IN/OUT 으로 학습시간(분) 계산 */
async function computeStudyTimeMinFromAttendance(studentId, date) {
  const rows = await Attendance.find({ userId: studentId, date }).lean();
  const ins  = rows.filter(r => r.type === 'IN').map(r => r.time).sort();
  const outs = rows.filter(r => r.type === 'OUT').map(r => r.time).sort();
  if (!ins.length || !outs.length) return null;

  const firstIn  = ins[0];                    // 가장 이른 등원
  const lastOut  = outs[outs.length - 1];     // 가장 늦은 하원
  const start = moment.tz(`${date} ${firstIn}`, 'YYYY-MM-DD HH:mm:ss', KST);
  const end   = moment.tz(`${date} ${lastOut}`, 'YYYY-MM-DD HH:mm:ss', KST);
  let diffMin = end.diff(start, 'minutes');
  if (!Number.isFinite(diffMin) || diffMin < 0) diffMin = 0;
  return diffMin;
}

// ====== 날짜별 목록(등원 ∪ 해당일 로그보유) ======
exports.listByDate = async (req, res) => {
  const date = (req.query.date || moment().tz(KST).format('YYYY-MM-DD'));

  const inRecs = await Attendance.find({ date, type: 'IN' }).lean();
  const inIds = inRecs.map(r => String(r.userId));

  const logs = await LessonLog.find({ date }).lean();
  const logIds = logs.map(l => String(l.studentId));

  const ids = [...new Set([...inIds, ...logIds])];

  const users = await User.find({ _id: { $in: ids } }).lean();
  const byId = Object.fromEntries(users.map(u => [String(u._id), u]));
  const logByStudent = Object.fromEntries(logs.map(l => [String(l.studentId), l]));

  const outs = await Attendance.find({ date, type: 'OUT', userId: { $in: ids } }).lean();
  const byUserType = {};
  [...inRecs, ...outs].forEach(r => {
    const k = String(r.userId);
    byUserType[k] = byUserType[k] || {};
    byUserType[k][r.type] = r.time?.slice(0, 5) || '';
  });

  const items = ids.map(id => {
    const log = logByStudent[id];
    const checkIn = byUserType[id]?.IN || '';
    const checkOut = byUserType[id]?.OUT || '';
    return {
      studentId: id,
      name: byId[id]?.name || '',
      logId: log ? String(log._id) : '',
      hasLog: !!log,
      notifyStatus: log?.notifyStatus || (log ? '대기' : '없음'),
      scheduledAt: log?.scheduledAt || null,
      checkIn,
      checkOut,
      missingIn: !!log && !checkIn
    };
  });

  res.json({ date, items });
};

// ====== 리포트 1건 상세(학생+날짜) ======
exports.getDetail = async (req, res) => {
  const { studentId, date } = req.query;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  const log = await LessonLog.findOne({ studentId, date }).lean();
  if (!log) return res.json({});

  // 프론트 호환용 별칭(studyTimeMin) 포함
  res.json({
    ...log,
    studyTimeMin: log.durationMin ?? null
  });
};

// ====== 작성/수정(업서트) ======
exports.createOrUpdate = async (req, res) => {
  const body = { ...(req.body || {}) };
  const { studentId, date } = body;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  // 프론트에서 studyTimeMin으로 들어오면 durationMin에 매핑
  if (body.studyTimeMin !== undefined && body.studyTimeMin !== null && body.studyTimeMin !== '') {
    const n = Number(body.studyTimeMin);
    if (Number.isFinite(n)) body.durationMin = n;
    delete body.studyTimeMin;
  }

  // 긴 텍스트 안전 가드
  if (typeof body.feedback === 'string' && body.feedback.length > 2000) {
    body.feedback = body.feedback.slice(0, 1999) + '…';
  }

  // durationMin 없으면 Attendance로 자동 계산해서 채움
  if (body.durationMin === undefined || body.durationMin === null || body.durationMin === '') {
    const autoMin = await computeStudyTimeMinFromAttendance(studentId, date);
    if (autoMin !== null) body.durationMin = autoMin;
  }

  const doc = await LessonLog.findOneAndUpdate(
    { studentId, date },
    { $set: body },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ ok: true, id: doc._id, doc });
};

// ====== 예약 대기 목록 ======
exports.listPending = async (_req, res) => {
  const now = new Date();
  const items = await LessonLog.find({
    notifyStatus: '대기',
    scheduledAt: { $ne: null, $lte: now }
  }).limit(200).lean();
  res.json(items);
};

// ====== 1건 발송 ======
exports.sendOne = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await LessonLog.findById(id);
    if (!log) return res.status(404).json({ message: 'LessonLog 없음' });
    if (log.notifyStatus === '발송') {
      return res.status(409).json({ ok: false, message: '이미 발송됨' });
    }

    const student = await User.findById(log.studentId);
    if (!student || !student.parentPhone) {
      return res.status(400).json({ message: '학부모 연락처 없음' });
    }

    // 발송 전 durationMin 자동 보정(없으면 계산해서 저장)
    if (log.durationMin === undefined || log.durationMin === null) {
      const autoMin = await computeStudyTimeMinFromAttendance(log.studentId, log.date);
      if (autoMin !== null) {
        log.durationMin = autoMin;
        await log.save();
      }
    }

    let tpl = getDailyTplCodeFallback();
    if (!tpl) tpl = await getSetting('daily_tpl_code', '');
    if (!tpl) return res.status(400).json({ message: '리포트 템플릿 코드 미설정(.env DAILY_REPORT_TPL_CODE)' });

    const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
    const dateLabel = m.format('YYYY.MM.DD(ddd)');

    // alimtalkReport가 타이틀/본문/버튼/치환을 모두 처리함
    const code = String(log._id); // 공개 링크용 식별자
    const ok = await sendReportAlimtalk(student.parentPhone, tpl, {
      학생명: student.name,
      과정: log.course || '-',
      수업일자: dateLabel,
      교재: log.book || '-',
      수업요약: log.content || '',
      과제요약: log.homework || '',
      피드백요약: log.feedback || '',
      code
    });

    // 로깅용 payloadSize(본문 대략 길이)
    const bodyForSize = [
      `1. 과정 : ${log.course || '-'}`,
      `2. 교재 : ${log.book || '-'}`,
      `3. 수업내용 : ${log.content || ''}`,
      `4. 과제 : ${log.homework || ''}`,
      `5. 개별 피드백 : ${log.feedback || ''}`
    ].join('\n');

    await NotificationLog.create({
      studentId: log.studentId,
      type: '일일리포트',
      status: ok ? '성공' : '실패',
      code: ok ? '0' : 'ERR',
      message: ok ? 'OK' : '알림톡 발송 실패',
      payloadSize: Buffer.byteLength(bodyForSize, 'utf8')
    });

    log.notifyStatus = ok ? '발송' : '실패';
    log.notifyLog = ok ? 'OK' : '알림톡 발송 실패';
    await log.save();

    res.json({ ok, id: log._id });
  } catch (e) {
    console.error('[lessonsController.sendOne]', e);
    res.status(500).json({ message: '단건 발송 오류', error: String(e?.message || e) });
  }
};

// ====== 선택 발송(여러 건) ======
exports.sendSelected = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids 배열 필요' });
  }

  let sent = 0, skipped = 0, failed = 0;
  for (const _id of ids) {
    try {
      const log = await LessonLog.findById(_id);
      if (!log) { failed++; continue; }
      if (log.notifyStatus === '발송') { skipped++; continue; }

      const fakeReq = { params: { id: String(_id) } };
      const fakeRes = { json: () => {}, status: () => ({ json: () => {} }) };
      await exports.sendOne(fakeReq, fakeRes);

      const fresh = await LessonLog.findById(_id).lean();
      if (fresh?.notifyStatus === '발송') sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  res.json({ ok: true, sent, skipped, failed });
};

// ====== 자동 발송(예약분) ======
exports.sendBulk = async (_req, res) => {
  const list = await LessonLog.find({
    notifyStatus: '대기',
    scheduledAt: { $ne: null, $lte: new Date() }
  }).select('_id').lean();

  let sent = 0, failed = 0;
  for (const item of list) {
    try {
      const r = await LessonLog.findById(item._id);
      if (!r) { failed++; continue; }
      if (r.notifyStatus === '발송') { continue; }

      const fakeReq = { params: { id: String(item._id) } };
      const fakeRes = { json: () => {}, status: () => ({ json: () => {} }) };
      await exports.sendOne(fakeReq, fakeRes);

      const fresh = await LessonLog.findById(item._id).lean();
      (fresh?.notifyStatus === '발송') ? sent++ : failed++;
    } catch {
      failed++;
    }
  }
  res.json({ ok: true, sent, failed });
};
