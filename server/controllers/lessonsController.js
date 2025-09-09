// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');

const { sendReportAlimtalk } = require('../utils/alimtalkReport'); // ★ 리포트용 전송 모듈(강조표기형)
const KST = 'Asia/Seoul';

// ──────────────────────────────────────────────
// 공용 유틸
async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return (s && typeof s.value === 'string') ? s.value : defVal;
}
function getDailyTplCode() {
  // .env 우선, 없으면 DB settings.daily_tpl_code
  if (process.env.DAILY_REPORT_TPL_CODE) return process.env.DAILY_REPORT_TPL_CODE;
  return null;
}

// ──────────────────────────────────────────────
// A. 날짜별 목록(등원 ∪ 해당일 리포트 작성자)
exports.listByDate = async (req, res) => {
  try {
    const date = (req.query.date || moment().tz(KST).format('YYYY-MM-DD'));

    const inRecs = await Attendance.find({ date, type: 'IN' }).lean();
    const inIds = inRecs.map(r => String(r.userId));

    const logs = await LessonLog.find({ date }).lean();
    const logIds = logs.map(l => String(l.studentId));

    const ids = [...new Set([...inIds, ...logIds])];

    const users = await User.find({ _id: { $in: ids } }).lean();
    const userById = Object.fromEntries(users.map(u => [String(u._id), u]));

    const outs = await Attendance.find({ date, type: 'OUT', userId: { $in: ids } }).lean();
    const timeMap = {};
    [...inRecs, ...outs].forEach(r => {
      const k = String(r.userId);
      timeMap[k] = timeMap[k] || {};
      timeMap[k][r.type] = (r.time || '').slice(0, 5);
    });

    const logByStudent = Object.fromEntries(logs.map(l => [String(l.studentId), l]));

    const items = ids.map(id => {
      const u = userById[id];
      const log = logByStudent[id];
      return {
        studentId: id,
        name: u?.name || '',
        logId: log ? String(log._id) : '',
        hasLog: !!log,
        notifyStatus: log?.notifyStatus || (log ? '대기' : '없음'),
        scheduledAt: log?.scheduledAt || null,
        checkIn: timeMap[id]?.IN || '',
        checkOut: timeMap[id]?.OUT || '',
        // 등원 누락 여부(리포트는 있는데 IN 기록이 없음)
        missingIn: !!log && !timeMap[id]?.IN
      };
    });

    res.json({ date, items });
  } catch (e) {
    console.error('[lessonsController.listByDate] ERR:', e);
    res.status(500).json({ message: '목록 조회 오류', error: String(e) });
  }
};

// B. 리포트 1건 상세
exports.getDetail = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    if (!studentId || !date) {
      return res.status(400).json({ message: 'studentId, date 필수' });
    }
    const log = await LessonLog.findOne({ studentId, date }).lean();
    res.json(log || {});
  } catch (e) {
    console.error('[lessonsController.getDetail] ERR:', e);
    res.status(500).json({ message: '상세 조회 오류', error: String(e) });
  }
};

// C. 작성/수정(업서트)
exports.createOrUpdate = async (req, res) => {
  try {
    const body = req.body || {};
    const { studentId, date } = body;
    if (!studentId || !date) {
      return res.status(400).json({ message: 'studentId, date 필수' });
    }

    // 매우 긴 피드백 보호
    if (typeof body.feedback === 'string' && body.feedback.length > 1000) {
      body.feedback = body.feedback.slice(0, 999) + '…';
    }

    const doc = await LessonLog.findOneAndUpdate(
      { studentId, date },
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ok: true, id: doc._id, doc });
  } catch (e) {
    console.error('[lessonsController.createOrUpdate] ERR:', e);
    res.status(500).json({ message: '저장 오류', error: String(e) });
  }
};

// D. 예약 대기 목록(자동발송 후보)
exports.listPending = async (_req, res) => {
  try {
    const now = new Date();
    const items = await LessonLog.find({
      notifyStatus: '대기',
      scheduledAt: { $ne: null, $lte: now }
    }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error('[lessonsController.listPending] ERR:', e);
    res.status(500).json({ message: '대기 목록 오류', error: String(e) });
  }
};

// E. 1건 발송
exports.sendOne = async (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN][LESSONS] POST /api/admin/lessons/send-one', id);
  try {
    const log = await LessonLog.findById(id);
    if (!log) return res.status(404).json({ message: 'LessonLog 없음' });
    if (log.notifyStatus === '발송') {
      return res.status(409).json({ ok: false, message: '이미 발송됨' });
    }

    const student = await User.findById(log.studentId);
    if (!student || !student.parentPhone) {
      return res.status(400).json({ message: '학부모 연락처 없음' });
    }

    // 템플릿 코드
    let tpl = getDailyTplCode();
    if (!tpl) tpl = await getSetting('daily_tpl_code', '');
    if (!tpl) {
      return res.status(400).json({ message: '리포트 템플릿 코드 미설정(.env DAILY_REPORT_TPL_CODE 또는 settings.daily_tpl_code)' });
    }

    // 날짜 라벨(템플릿 2줄 타이틀에 사용)
    const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
    const dateLabel = m.format('YYYY.MM.DD(ddd)');

    // 전송(한글/영문 키 모두 허용됨)
    const ok = await sendReportAlimtalk(student.parentPhone, tpl, {
      name: student.name,
      course: log.course || '-',
      dateLabel,
      book: log.book || '-',
      content: log.content || '',
      homework: log.homework || '',
      feedback: log.feedback || '',
      code: String(log._id)
    });

    // 발송 로그 적재
    await NotificationLog.create({
      studentId: log.studentId,
      type: '일일리포트',
      status: ok ? '성공' : '실패',
      code: ok ? '0' : 'ERR',
      message: ok ? 'OK' : '알림톡 발송 실패',
      payloadSize: Buffer.byteLength((log.content || '') + (log.homework || '') + (log.feedback || ''), 'utf8')
    });

    log.notifyStatus = ok ? '발송' : '실패';
    log.notifyLog = ok ? 'OK' : '알림톡 발송 실패';
    await log.save();

    res.json({ ok, id: log._id });
  } catch (e) {
    console.error('[lessonsController.sendOne] ERR:', e);
    res.status(500).json({ message: '단건 발송 오류', error: String(e) });
  }
};

// F. 선택 발송(여러 건)
exports.sendSelected = async (req, res) => {
  try {
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

        // 기존 sendOne 재사용
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
  } catch (e) {
    console.error('[lessonsController.sendSelected] ERR:', e);
    res.status(500).json({ message: '선택 발송 오류', error: String(e) });
  }
};

// G. 자동 발송(예약 도달분)
exports.sendBulk = async (_req, res) => {
  try {
    const list = await LessonLog.find({
      notifyStatus: '대기',
      scheduledAt: { $ne: null, $lte: new Date() }
    }).select('_id').lean();

    let sent = 0, failed = 0;
    for (const item of list) {
      try {
        const r = await LessonLog.findById(item._id);
        if (!r) { failed++; continue; }
        if (r.notifyStatus === '발송') continue;

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
  } catch (e) {
    console.error('[lessonsController.sendBulk] ERR:', e);
    res.status(500).json({ message: '자동 발송 오류', error: String(e) });
  }
};
