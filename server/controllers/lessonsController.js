// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');
const { buildDailyTemplateBody, makeTwoLineTitle } = require('../utils/formatDailyReport');
const { issueToken } = require('../utils/reportToken');
const { sendAlimtalk } = require('../utils/alimtalk');

const KST = 'Asia/Seoul';

// ====== 환경설정 ======
const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';
function getDailyTplCodeFallback() {
  if (process.env.DAILY_REPORT_TPL_CODE) return process.env.DAILY_REPORT_TPL_CODE;
  return null;
}
async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}

// ====== 날짜별 목록 조회 (관리자용) ======
exports.listByDate = async (req, res) => {
  const date = (req.query.date || moment().tz(KST).format('YYYY-MM-DD'));

  // A. 등원(IN)한 학생
  const inRecs = await Attendance.find({ date, type: 'IN' }).lean();
  const inIds = inRecs.map(r => String(r.userId));

  // B. 그날 LessonLog가 있는 학생 (등원 미체크라도 포함)
  const logs = await LessonLog.find({ date }).lean();
  const logIds = logs.map(l => String(l.studentId));

  // A ∪ B (중복 제거)
  const ids = [...new Set([...inIds, ...logIds])];

  // 학생/로그/OUT 맵
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
      missingIn: !!log && !checkIn // ← 리포트는 있지만 IN이 없는 상태
    };
  });

  res.json({ date, items });
};

// ====== 작성/수정 ======
exports.createOrUpdate = async (req, res) => {
  const body = req.body || {};
  const { studentId, date } = body;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  if (typeof body.feedback === 'string' && body.feedback.length > 1000) {
    body.feedback = body.feedback.slice(0, 999) + '…';
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

// ====== 1건 발송 (이미 발송이면 409) ======
exports.sendOne = async (req, res) => {
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

  let tpl = getDailyTplCodeFallback();
  if (!tpl) tpl = await getSetting('daily_tpl_code', '');
  if (!tpl) return res.status(400).json({ message: '리포트 템플릿 코드 미설정(.env DAILY_REPORT_TPL_CODE)' });

  const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
  const dateLabel = m.format('YYYY.MM.DD(ddd)');

  const emtitle = makeTwoLineTitle(student.name, log.course || '', dateLabel, 23);

  const message = buildDailyTemplateBody({
    course: log.course || '-',
    book: log.book || '-',
    content: log.content || '',
    homework: log.homework || '',
    feedback: log.feedback || ''
  });

  const code = String(log._id);
  const button = {
    name: '리포트 보기',
    url_mobile: `${REPORT_BASE.replace(/\/+$/,'')}/r/${code}`,
    url_pc:     `${REPORT_BASE.replace(/\/+$/,'')}/r/${code}`
  };

  const ok = await sendAlimtalk(student.parentPhone, tpl, {
    name: student.name,
    emtitle,
    message,
    button
  });

  await NotificationLog.create({
    studentId: log.studentId,
    type: '일일리포트',
    status: ok ? '성공' : '실패',
    code: ok ? '0' : 'ERR',
    message: ok ? 'OK' : '알림톡 발송 실패',
    payloadSize: Buffer.byteLength((message || ''), 'utf8')
  });

  log.notifyStatus = ok ? '발송' : '실패';
  log.notifyLog = ok ? 'OK' : '알림톡 발송 실패';
  await log.save();

  res.json({ ok, id: log._id });
};

// ====== 선택 발송 (여러 건 즉시 발송) ======
exports.sendSelected = async (req, res) => {
  const { ids } = req.body; // LessonLog _id 배열
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids 배열 필요' });
  }

  let sent = 0, skipped = 0, failed = 0;
  for (const _id of ids) {
    try {
      const log = await LessonLog.findById(_id);
      if (!log) { failed++; continue; }
      if (log.notifyStatus === '발송') { skipped++; continue; }

      // sendOne 재사용(HTTP 없이 내부 호출)
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
      if (r.notifyStatus === '발송') { continue; } // 더블가드

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
