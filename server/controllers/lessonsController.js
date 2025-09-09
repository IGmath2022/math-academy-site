// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');
const StudentProfile = require('../models/StudentProfile');
const CounselLog = require('../models/CounselLog');
const { buildDailyTemplateBody, makeTwoLineTitle } = require('../utils/formatDailyReport');
const { sendReportAlimtalk } = require('../utils/alimtalkReport');

const KST = 'Asia/Seoul';
const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';

async function getSetting(key, defVal='') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}
function getDailyTplCodeFallback() {
  return process.env.DAILY_REPORT_TPL_CODE || null;
}

/** 날짜별 목록(등원 ∪ 로그보유) + 체크인/아웃 + 누락등원 플래그 */
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
    byUserType[k][r.type] = r.time?.slice(0,5) || '';
  });

  const items = ids.map(id => {
    const log = logByStudent[id];
    return {
      studentId: id,
      name: byId[id]?.name || '',
      logId: log ? String(log._id) : '',
      hasLog: !!log,
      notifyStatus: log?.notifyStatus || (log ? '대기' : '없음'),
      scheduledAt: log?.scheduledAt || null,
      checkIn: byUserType[id]?.IN || '',
      checkOut: byUserType[id]?.OUT || '',
      missingIn: !!log && !byUserType[id]?.IN
    };
  });

  res.json({ date, items });
};

/** 단건 조회 */
exports.getDetail = async (req, res) => {
  const { studentId, date } = req.query;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });
  const log = await LessonLog.findOne({ studentId, date }).lean();
  res.json(log || {});
};

/** 작성/수정(업서트) — 확장 필드까지 저장 */
exports.createOrUpdate = async (req, res) => {
  const b = req.body || {};
  const { studentId, date } = b;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  // 긴 텍스트 가드
  if (typeof b.feedback === 'string' && b.feedback.length > 2000) {
    b.feedback = b.feedback.slice(0, 1999) + '…';
  }

  // 태그 정규화(쉼표→배열)
  if (typeof b.tags === 'string') {
    b.tags = b.tags.split(',').map(s => s.trim()).filter(Boolean);
  }

  const setObj = {
    course: b.course ?? '',
    book: b.book ?? '',
    content: b.content ?? '',
    homework: b.homework ?? '',
    feedback: b.feedback ?? '',
    focus: b.focus ?? null,
    durationMin: b.durationMin ?? null,
    progressPct: b.progressPct ?? null,
    nextPlan: b.nextPlan ?? '',
    headline: b.headline ?? '',
    tags: Array.isArray(b.tags) ? b.tags : [],
    classType: b.classType ?? '',
    teacher: b.teacher ?? '',
  };
  if (b.scheduledAt) setObj.scheduledAt = new Date(b.scheduledAt);

  const doc = await LessonLog.findOneAndUpdate(
    { studentId, date },
    { $set: setObj, $setOnInsert: { studentId, date } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ ok: true, id: doc._id, doc });
};

/** 예약 대기 목록 */
exports.listPending = async (_req, res) => {
  const now = new Date();
  const items = await LessonLog.find({
    notifyStatus: '대기',
    scheduledAt: { $ne: null, $lte: now }
  }).limit(200).lean();
  res.json(items);
};

/** 최근 N회 시리즈(차트용) */
exports.getSeries = async (req, res) => {
  const { studentId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '5', 10), 30);
  const rows = await LessonLog.find({ studentId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  const series = rows
    .map(r => ({
      date: r.date,
      focus: r.focus ?? null,
      durationMin: r.durationMin ?? null,
      progressPct: r.progressPct ?? null,
      headline: r.headline || '',
    }))
    .reverse();
  res.json({ studentId, series });
};

/** 단건 발송 */
exports.sendOne = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await LessonLog.findById(id);
    if (!log) return res.status(404).json({ message: 'LessonLog 없음' });
    if (log.notifyStatus === '발송') return res.status(409).json({ ok: false, message: '이미 발송됨' });

    const student = await User.findById(log.studentId);
    if (!student?.parentPhone) return res.status(400).json({ message: '학부모 연락처 없음' });

    let tpl = getDailyTplCodeFallback();
    if (!tpl) tpl = await getSetting('daily_tpl_code', '');
    if (!tpl) return res.status(400).json({ message: '리포트 템플릿 코드 미설정' });

    const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
    const dateLabel = m.format('YYYY.MM.DD(ddd)');

    // 템플릿 변수 치환(본문은 템플릿과 동일 구조 유지)
    const emtitle = makeTwoLineTitle(student.name, log.course || '', dateLabel, 23);
    const message = buildDailyTemplateBody({
      course: log.course || '-',
      book: log.book || '-',
      content: log.content || '',
      homework: log.homework || '',
      feedback: log.feedback || ''
    });

    const code = String(log._id); // 공개뷰 코드
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

    await NotificationLog.create({
      studentId: log.studentId,
      type: '일일리포트',
      status: ok ? '성공' : '실패',
      code: ok ? '0' : 'ERR',
      message: ok ? 'OK' : '알림톡 발송 실패'
    });

    log.notifyStatus = ok ? '발송' : '실패';
    log.notifyLog = ok ? 'OK' : '알림톡 발송 실패';
    await log.save();

    res.json({ ok, id: log._id });
  } catch (e) {
    console.error('[lessonsController.sendOne]', e);
    res.status(500).json({ message: '단건 발송 오류', error: String(e) });
  }
};

/** 선택 발송 */
exports.sendSelected = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids 배열 필요' });

  let sent = 0, skipped = 0, failed = 0;
  for (const _id of ids) {
    try {
      const log = await LessonLog.findById(_id);
      if (!log) { failed++; continue; }
      if (log.notifyStatus === '발송') { skipped++; continue; }

      const mockReq = { params: { id: String(_id) } };
      const mockRes = { json: () => {}, status: () => ({ json: () => {} }) };
      await exports.sendOne(mockReq, mockRes);

      const fresh = await LessonLog.findById(_id).lean();
      if (fresh?.notifyStatus === '발송') sent++; else failed++;
    } catch {
      failed++;
    }
  }
  res.json({ ok: true, sent, skipped, failed });
};

/** 예약분 일괄 발송 */
exports.sendBulk = async (_req, res) => {
  const list = await LessonLog.find({
    notifyStatus: '대기',
    scheduledAt: { $ne: null, $lte: new Date() }
  }).select('_id').lean();

  let sent = 0, failed = 0;
  for (const { _id } of list) {
    try {
      const mockReq = { params: { id: String(_id) } };
      const mockRes = { json: () => {}, status: () => ({ json: () => {} }) };
      await exports.sendOne(mockReq, mockRes);

      const fresh = await LessonLog.findById(_id).lean();
      (fresh?.notifyStatus === '발송') ? sent++ : failed++;
    } catch {
      failed++;
    }
  }
  res.json({ ok: true, sent, failed });
};
