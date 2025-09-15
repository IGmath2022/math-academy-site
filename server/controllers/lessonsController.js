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

/** 🔒 자동발송 스위치 (DB 키 통일: daily_report_auto_on)
 *  - sendBulk에서는 더 이상 이 값을 직접 확인하지 않음(크론에서 확인)
 */
async function isDailyAutoOn() {
  const s = await Setting.findOne({ key: 'daily_report_auto_on' });
  return s?.value === 'true';
}

/** IN/OUT 으로 학습시간(분) 계산 */
async function computeStudyTimeMinFromAttendance(studentId, date) {
  const rows = await Attendance.find({ userId: studentId, date }).lean();
  const ins  = rows.filter(r => r.type === 'IN').map(r => r.time).sort();
  const outs = rows.filter(r => r.type === 'OUT').map(r => r.time).sort();
  if (!ins.length || !outs.length) return null;

  const firstIn  = ins[0];
  const lastOut  = outs[outs.length - 1];
  const start = moment.tz(`${date} ${firstIn}`, 'YYYY-MM-DD HH:mm:ss', KST);
  const end   = moment.tz(`${date} ${lastOut}`, 'YYYY-MM-DD HH:mm:ss', KST);
  let diffMin = end.diff(start, 'minutes');
  if (!Number.isFinite(diffMin) || diffMin < 0) diffMin = 0;
  return diffMin;
}

/* =========================================================
 * 날짜별 목록(필터 지원)
 *   GET /api/admin/lessons?date=YYYY-MM-DD&scope=present|all|missing
 * ========================================================= */
exports.listByDate = async (req, res) => {
  const date = (req.query.date || moment().tz(KST).format('YYYY-MM-DD'));
  const scope = String(req.query.scope || 'present').toLowerCase(); // present | all | missing

  // 1) 당일 출석/로그 수집
  const inRecs = await Attendance.find({ date, type: 'IN' }).lean();
  const inIds = inRecs.map(r => String(r.userId));

  const dayLogs = await LessonLog.find({ date }).lean();
  const logIds = dayLogs.map(l => String(l.studentId));

  const presentSet = new Set([...inIds, ...logIds]);

  // 2) scope에 따른 대상 학생 ID 결정
  let ids = [];
  let users = [];

  if (scope === 'present') {
    // 출석했거나 이미 로그가 있는 학생
    ids = [...presentSet];
    users = await User.find({ _id: { $in: ids } }).lean();
  } else {
    // 활성 학생 전체(비활성 제외)
    const allStudents = await User.find({
      role: 'student',
      $or: [{ active: true }, { active: { $exists: false } }]
    }).select('_id name').lean();

    const allIds = allStudents.map(u => String(u._id));

    if (scope === 'all') {
      ids = allIds;
    } else if (scope === 'missing') {
      // 출석/로그 둘 다 없는 학생
      ids = allIds.filter(id => !presentSet.has(id));
    } else {
      ids = [...presentSet];
    }

    const idsSet = new Set(ids);
    users = allStudents.filter(u => idsSet.has(String(u._id)));
  }

  // 3) 대상 학생들에 한해 당일 출결/로그 재조회
  const [ins, outs, logs] = await Promise.all([
    Attendance.find({ date, type: 'IN',  userId: { $in: ids } }).lean(),
    Attendance.find({ date, type: 'OUT', userId: { $in: ids } }).lean(),
    LessonLog.find({ date, studentId: { $in: ids } }).lean(),
  ]);

  const byUserType = {};
  [...ins, ...outs].forEach(r => {
    const k = String(r.userId);
    byUserType[k] = byUserType[k] || {};
    byUserType[k][r.type] = r.time?.slice(0, 5) || '';
  });

  const logByStudent = Object.fromEntries(logs.map(l => [String(l.studentId), l]));
  const byId = Object.fromEntries(users.map(u => [String(u._id), u]));

  // 4) 응답 아이템
  const items = ids.map(id => {
    const log = logByStudent[id];
    const checkIn = byUserType[id]?.IN || '';
    const checkOut = byUserType[id]?.OUT || '';
    const hasAttendance = !!(checkIn || checkOut);

    return {
      studentId: id,
      name: byId[id]?.name || '',
      logId: log ? String(log._id) : '',
      hasLog: !!log,
      notifyStatus: log?.notifyStatus || (log ? '대기' : '없음'),
      scheduledAt: log?.scheduledAt || null,
      checkIn,
      checkOut,

      // 행 강조용(등원이 없으면 true)
      missingIn: !checkIn,

      // 힌트 필드(선택 사용)
      hasAttendance,
      missingAttendance: !hasAttendance,
      scopeApplied: scope,
    };
  });

  // 이름순 정렬
  items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));

  res.json({ date, scope, items });
};

/* =========================================================
 * 리포트 1건 상세(학생+날짜)
 *   GET /api/admin/lessons/detail?studentId=&date=
 * ========================================================= */
exports.getDetail = async (req, res) => {
  const { studentId, date } = req.query;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  const log = await LessonLog.findOne({ studentId, date }).lean();
  if (!log) return res.json({});

  res.json({
    ...log,
    studyTimeMin: log.durationMin ?? null
  });
};

/* =========================================================
 * 작성/수정(업서트)
 *   POST /api/admin/lessons
 * ========================================================= */
exports.createOrUpdate = async (req, res) => {
  const body = { ...(req.body || {}) };
  const { studentId, date } = body;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  // 프론트 호환: studyTimeMin → durationMin
  if (body.studyTimeMin !== undefined && body.studyTimeMin !== null && body.studyTimeMin !== '') {
    const n = Number(body.studyTimeMin);
    if (Number.isFinite(n)) body.durationMin = n;
    delete body.studyTimeMin;
  }

  // 긴 텍스트 가드
  if (typeof body.feedback === 'string' && body.feedback.length > 2000) {
    body.feedback = body.feedback.slice(0, 1999) + '…';
  }

  // durationMin 없으면 Attendance로 자동 계산
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

/* =========================================================
 * 예약 대기 목록
 *   GET /api/admin/lessons/pending
 * ========================================================= */
exports.listPending = async (_req, res) => {
  const now = new Date();
  const items = await LessonLog.find({
    notifyStatus: '대기',
    scheduledAt: { $ne: null, $lte: now }
  }).limit(200).lean();
  res.json(items);
};

/* =========================================================
 * 1건 발송
 *   POST /api/admin/lessons/send-one/:id
 * ========================================================= */
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

    // 발송 전 학습시간 자동 보정
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

    // 공개 링크용 식별자
    const code = String(log._id);

    // alimtalkReport가 타이틀/본문/버튼/치환 처리
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

/* =========================================================
 * 선택 발송(여러 건)
 *   POST /api/admin/lessons/send-selected
 *   body: { ids: [logId, ...] }
 * ========================================================= */
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

/* =========================================================
 * 자동 발송(예약분)
 *   POST /api/admin/lessons/send-bulk
 *   - ON/OFF 판단은 app.js의 CRON에서 DB 키 'daily_report_auto_on'으로 수행
 * ========================================================= */
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

/* ------------------------------------------------------------------
 * 등/하원 수동 수정 API
 * -----------------------------------------------------------------*/

// HH:mm → HH:mm:ss 보정
function toHHMMSS(t) {
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return null;
}

// 등/하원 1건 조회 (학생+날짜)
exports.getAttendanceOne = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

    const rows = await Attendance.find({ userId: studentId, date }).lean();
    const ins  = rows.filter(r => r.type === 'IN').map(r => r.time).sort();
    const outs = rows.filter(r => r.type === 'OUT').map(r => r.time).sort();

    let checkIn = ins[0] || null;                  // HH:mm:ss
    let checkOut = outs[outs.length - 1] || null;  // HH:mm:ss
    let source = 'attendance';

    // Attendance가 없으면 LessonLog inTime/outTime 사용
    if (!checkIn || !checkOut) {
      const log = await LessonLog.findOne({ studentId, date }).lean();
      if (log?.inTime)  checkIn = toHHMMSS(log.inTime);
      if (log?.outTime) checkOut = toHHMMSS(log.outTime);
      if (checkIn || checkOut) source = 'log';
    }

    // 학습시간 계산
    let studyMin = null;
    if (checkIn && checkOut) {
      const start = moment.tz(`${date} ${checkIn}`,  'YYYY-MM-DD HH:mm:ss', KST);
      const end   = moment.tz(`${date} ${checkOut}`, 'YYYY-MM-DD HH:mm:ss', KST);
      const diff  = end.diff(start, 'minutes');
      studyMin = diff > 0 ? diff : 0;
    }

    res.json({
      studentId, date,
      checkIn: checkIn ? checkIn.slice(0,5) : "",
      checkOut: checkOut ? checkOut.slice(0,5) : "",
      source, studyMin
    });
  } catch (e) {
    console.error('[lessonsController.getAttendanceOne]', e);
    res.status(500).json({ message: '출결 조회 오류', error: String(e?.message || e) });
  }
};

// 등/하원 수동 설정(관리자)
exports.setAttendanceTimes = async (req, res) => {
  try {
    const { studentId, date, checkIn, checkOut, overwrite = true } = req.body || {};
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });
    const tIn  = toHHMMSS(checkIn);
    const tOut = toHHMMSS(checkOut);

    if (overwrite) {
      await Attendance.deleteMany({ userId: studentId, date });
      if (tIn)  await Attendance.create({ userId: studentId, date, type: 'IN',  time: tIn  });
      if (tOut) await Attendance.create({ userId: studentId, date, type: 'OUT', time: tOut });
    } else {
      if (tIn) {
        await Attendance.findOneAndUpdate(
          { userId: studentId, date, type: 'IN' },
          { $set: { time: tIn } },
          { upsert: true }
        );
      }
      if (tOut) {
        await Attendance.findOneAndUpdate(
          { userId: studentId, date, type: 'OUT' },
          { $set: { time: tOut } },
          { upsert: true }
        );
      }
    }

    // LessonLog에도 반영(보고서 일관성)
    let durationMin = null;
    if (tIn && tOut) {
      const start = moment.tz(`${date} ${tIn}`,  'YYYY-MM-DD HH:mm:ss', KST);
      const end   = moment.tz(`${date} ${tOut}`, 'YYYY-MM-DD HH:mm:ss', KST);
      const diff  = end.diff(start, 'minutes');
      durationMin = diff > 0 ? diff : 0;
    }

    await LessonLog.findOneAndUpdate(
      { studentId, date },
      { $set: {
        inTime:  tIn  ? tIn.slice(0,5) : null,
        outTime: tOut ? tOut.slice(0,5) : null,
        ...(durationMin !== null ? { durationMin } : {})
      }},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      ok: true,
      studentId, date,
      checkIn:  tIn  ? tIn.slice(0,5)  : "",
      checkOut: tOut ? tOut.slice(0,5) : "",
      durationMin
    });
  } catch (e) {
    console.error('[lessonsController.setAttendanceTimes]', e);
    res.status(500).json({ message: '출결 수정 오류', error: String(e?.message || e) });
  }
};

/* ===========================
 * 자동발송 ON/OFF 설정 API
 * =========================== */

// GET /api/admin/settings/daily-auto -> { on: true|false }
exports.getDailyAuto = async (_req, res) => {
  try {
    const s = await Setting.findOne({ key: 'daily_report_auto_on' });
    const on = s?.value === 'true';
    res.json({ on });
  } catch (e) {
    res.status(500).json({ message: 'daily-auto 조회 실패', error: String(e?.message || e) });
  }
};

// POST /api/admin/settings/daily-auto { on: boolean } -> { ok, on }
exports.setDailyAuto = async (req, res) => {
  try {
    const on = !!req.body?.on;
    await Setting.findOneAndUpdate(
      { key: 'daily_report_auto_on' },
      { $set: { value: on ? 'true' : 'false' } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, on });
  } catch (e) {
    res.status(500).json({ message: 'daily-auto 저장 실패', error: String(e?.message || e) });
  }
};
