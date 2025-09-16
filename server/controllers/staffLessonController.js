// server/controllers/staffLessonController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const ClassGroup = require('../models/ClassGroup');
const NotificationLog = require('../models/NotificationLog');
const { sendReportAlimtalk } = require('../utils/alimtalkReport');

const KST = 'Asia/Seoul';

/* -------------------------------------------
 * 공통 유틸
 * ------------------------------------------*/
async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}
function getDailyTplCodeFallback() {
  if (process.env.DAILY_REPORT_TPL_CODE) return process.env.DAILY_REPORT_TPL_CODE;
  return null;
}
async function isDailyAutoOn() {
  const s = await Setting.findOne({ key: 'daily_report_auto_on' });
  return s?.value === 'true';
}
function toHHMMSS(t) {
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return null;
}
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

/** 교사 권한 스코프: 내가 담당인 반의 학생들 */
async function getTeacherScopeStudentIdSet(req) {
  const role = req.user?.role;
  const me = String(req.user?.id || '');
  if (role === 'super' || role === 'admin') return null; // 무제한
  if (role !== 'teacher') return new Set(); // requireStaff에서 보통 걸러짐
  const groups = await ClassGroup.find({ teachers: me, active: true })
    .select('students').lean();
  const ids = new Set();
  groups.forEach(g => (g.students || []).forEach(s => ids.add(String(s))));
  return ids;
}

/* -------------------------------------------
 * 리스트/상세/업서트
 * ------------------------------------------*/
/** GET /api/staff/lessons/by-date?date=YYYY-MM-DD&scope=present|all|missing */
exports.listByDate = async (req, res) => {
  const date = (req.query.date || moment().tz(KST).format('YYYY-MM-DD'));
  const scope = String(req.query.scope || 'present').toLowerCase(); // present | all | missing

  const limitIds = await getTeacherScopeStudentIdSet(req);

  // 1) 대상 학생 풀
  let allStudents = [];
  if (limitIds) {
    // teacher: 스코프 학생만
    allStudents = await User.find({ _id: { $in: [...limitIds] }, role: 'student', $or: [{active:true}, {active:{$exists:false}}] })
      .select('_id name').lean();
  } else {
    // admin/super: 전체 활성 학생
    allStudents = await User.find({ role: 'student', $or: [{active:true}, {active:{$exists:false}}] })
      .select('_id name').lean();
  }

  const allowedIdList = allStudents.map(u => String(u._id));
  const allowedSet = new Set(allowedIdList);

  // 2) 당일 출석/로그 수집(스코프 적용)
  const [inRecs, dayLogs] = await Promise.all([
    Attendance.find({ date, type: 'IN', userId: { $in: allowedIdList } }).lean(),
    LessonLog.find({ date, studentId: { $in: allowedIdList } }).lean(),
  ]);
  const inIds = inRecs.map(r => String(r.userId));
  const logIds = dayLogs.map(l => String(l.studentId));
  const presentSet = new Set([...inIds, ...logIds]);

  // 3) scope별 학생 id 목록
  let ids = [];
  if (scope === 'present') {
    ids = [...presentSet].filter(id => allowedSet.has(id));
  } else if (scope === 'all') {
    ids = allowedIdList;
  } else if (scope === 'missing') {
    ids = allowedIdList.filter(id => !presentSet.has(id));
  } else {
    ids = [...presentSet].filter(id => allowedSet.has(id));
  }

  // 4) 재조회(빠른 접근)
  const [ins, outs, logs] = await Promise.all([
    Attendance.find({ date, type: 'IN',  userId: { $in: ids } }).lean(),
    Attendance.find({ date, type: 'OUT', userId: { $in: ids } }).lean(),
    LessonLog.find({ date, studentId: { $in: ids } }).lean(),
  ]);

  const byUserType = {};
  [...ins, ...outs].forEach(r => {
    const k = String(r.userId);
    byUserType[k] = byUserType[k] || {};
    byUserType[k][r.type] = r.time?.slice(0,5) || '';
  });

  const logByStudent = Object.fromEntries(logs.map(l => [String(l.studentId), l]));
  const byId = Object.fromEntries(allStudents.map(u => [String(u._id), u]));

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
      missingIn: !checkIn,
      hasAttendance: !!(checkIn || checkOut),
      missingAttendance: !(checkIn || checkOut),
      scopeApplied: scope,
    };
  });

  items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  res.json({ date, scope, items });
};

/** GET /api/staff/lessons/detail?studentId=&date= */
exports.getDetail = async (req, res) => {
  const { studentId, date } = req.query;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  const limitIds = await getTeacherScopeStudentIdSet(req);
  if (limitIds && !limitIds.has(String(studentId))) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  const log = await LessonLog.findOne({ studentId, date }).lean();
  if (!log) return res.json({});
  res.json({ ...log, studyTimeMin: log.durationMin ?? null });
};

/** POST /api/staff/lessons/upsert */
exports.createOrUpdate = async (req, res) => {
  const body = { ...(req.body || {}) };
  const { studentId, date } = body;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

  const limitIds = await getTeacherScopeStudentIdSet(req);
  if (limitIds && !limitIds.has(String(studentId))) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  if (body.studyTimeMin !== undefined && body.studyTimeMin !== null && body.studyTimeMin !== '') {
    const n = Number(body.studyTimeMin);
    if (Number.isFinite(n)) body.durationMin = n;
    delete body.studyTimeMin;
  }

  if (typeof body.feedback === 'string' && body.feedback.length > 2000) {
    body.feedback = body.feedback.slice(0, 1999) + '…';
  }

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

/* -------------------------------------------
 * 예약/발송
 * ------------------------------------------*/
/** 내부용: 단건 발송(스코프 확인 포함) */
async function _sendOneWithScope(req, logId) {
  const log = await LessonLog.findById(logId);
  if (!log) throw new Error('LessonLog 없음');

  const limitIds = await getTeacherScopeStudentIdSet(req);
  if (limitIds && !limitIds.has(String(log.studentId))) {
    const e = new Error('권한이 없습니다.');
    e.status = 403;
    throw e;
  }

  if (log.notifyStatus === '발송') {
    return { ok: false, already: true, id: log._id };
  }

  const student = await User.findById(log.studentId);
  if (!student || !student.parentPhone) {
    const e = new Error('학부모 연락처 없음');
    e.status = 400;
    throw e;
  }

  if (log.durationMin === undefined || log.durationMin === null) {
    const autoMin = await computeStudyTimeMinFromAttendance(log.studentId, log.date);
    if (autoMin !== null) {
      log.durationMin = autoMin;
      await log.save();
    }
  }

  let tpl = getDailyTplCodeFallback();
  if (!tpl) tpl = await getSetting('daily_tpl_code', '');
  if (!tpl) {
    const e = new Error('리포트 템플릿 코드 미설정(.env DAILY_REPORT_TPL_CODE)');
    e.status = 400;
    throw e;
  }

  const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
  const dateLabel = m.format('YYYY.MM.DD(ddd)');

  const code = String(log._id);
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

  return { ok, id: log._id };
}

/** POST /api/staff/lessons/send-selected { ids: [] } */
exports.sendSelected = async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids 배열 필요' });
  }
  let sent = 0, skipped = 0, failed = 0;
  for (const _id of ids) {
    try {
      const r = await _sendOneWithScope(req, _id);
      if (r.already) { skipped++; continue; }
      if (r.ok) sent++; else failed++;
    } catch (e) {
      failed++;
    }
  }
  res.json({ ok: true, sent, skipped, failed });
};

/* -------------------------------------------
 * 출결 수동
 * ------------------------------------------*/
/** GET /api/staff/attendance/one?studentId=&date= */
exports.getAttendanceOne = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

    const limitIds = await getTeacherScopeStudentIdSet(req);
    if (limitIds && !limitIds.has(String(studentId))) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const rows = await Attendance.find({ userId: studentId, date }).lean();
    const ins  = rows.filter(r => r.type === 'IN').map(r => r.time).sort();
    const outs = rows.filter(r => r.type === 'OUT').map(r => r.time).sort();

    let checkIn = ins[0] || null;
    let checkOut = outs[outs.length - 1] || null;
    let source = 'attendance';

    if (!checkIn || !checkOut) {
      const log = await LessonLog.findOne({ studentId, date }).lean();
      if (log?.inTime)  checkIn = toHHMMSS(log.inTime);
      if (log?.outTime) checkOut = toHHMMSS(log.outTime);
      if (checkIn || checkOut) source = 'log';
    }

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
    console.error('[staffLessonController.getAttendanceOne]', e);
    res.status(500).json({ message: '출결 조회 오류', error: String(e?.message || e) });
  }
};

/** POST /api/staff/attendance/set-times */
exports.setAttendanceTimes = async (req, res) => {
  try {
    const { studentId, date, checkIn, checkOut, overwrite = true } = req.body || {};
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

    const limitIds = await getTeacherScopeStudentIdSet(req);
    if (limitIds && !limitIds.has(String(studentId))) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

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
    console.error('[staffLessonController.setAttendanceTimes]', e);
    res.status(500).json({ message: '출결 수정 오류', error: String(e?.message || e) });
  }
};

/* -------------------------------------------
 * 자동발송 스위치 (GET은 스태프, POST는 admin/super에서 라우터가 제한)
 * ------------------------------------------*/
exports.getDailyAuto = async (_req, res) => {
  try {
    const s = await Setting.findOne({ key: 'daily_report_auto_on' });
    const on = s?.value === 'true';
    res.json({ on });
  } catch (e) {
    res.status(500).json({ message: 'daily-auto 조회 실패', error: String(e?.message || e) });
  }
};
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

/* -------------------------------------------
 * 월간 로그 / 오늘 알림 위젯
 * ------------------------------------------*/
/** GET /api/staff/lessons/month-logs?month=YYYY-MM */
exports.listMonthLogs = async (req, res) => {
  const month = String(req.query.month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'month 형식: YYYY-MM' });
  }
  const begin = `${month}-01`;
  const end = `${month}-31`;

  const limitIds = await getTeacherScopeStudentIdSet(req);
  let filter = { date: { $gte: begin, $lte: end } };
  if (limitIds) filter.studentId = { $in: [...limitIds] };

  const rows = await LessonLog.find(filter)
    .populate('studentId', 'name')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  res.json(rows.map(r => ({
    id: String(r._id),
    date: r.date,
    student: r.studentId?.name || '',
    studentId: String(r.studentId?._id || ''),
    course: r.course || '',
    content: r.content || '',
    homework: r.homework || '',
    planNext: r.planNext || r.nextPlan || '',
    teacher: r.teacher || '',
    durationMin: r.durationMin ?? null,
    notifyStatus: r.notifyStatus || '대기'
  })));
};

/** GET /api/staff/alerts/today */
exports.alertsToday = async (req, res) => {
  const today = moment().tz(KST).format('YYYY-MM-DD');
  const yday  = moment().tz(KST).subtract(1, 'day').format('YYYY-MM-DD');

  const limitIds = await getTeacherScopeStudentIdSet(req);
  let studentFilter = { role: 'student', $or: [{active:true}, {active:{$exists:false}}] };
  if (limitIds) studentFilter._id = { $in: [...limitIds] };

  const students = await User.find(studentFilter).select('_id name').lean();
  const ids = students.map(s => String(s._id));
  const byId = Object.fromEntries(students.map(s => [String(s._id), s.name]));

  // 오늘 IN 없는 학생(미출결)
  const todaysIn = await Attendance.find({ userId: { $in: ids }, date: today, type: 'IN' }).select('userId').lean();
  const inSet = new Set(todaysIn.map(r => String(r.userId)));
  const missingAttendanceNames = ids.filter(id => !inSet.has(id)).map(id => byId[id]);

  // 어제 출석했는데 리포트가 없는 학생
  const yIn = await Attendance.find({ userId: { $in: ids }, date: yday, type: 'IN' }).select('userId').lean();
  const ySet = new Set(yIn.map(r => String(r.userId)));
  const yLogs = await LessonLog.find({ studentId: { $in: ids }, date: yday }).select('studentId').lean();
  const yLogSet = new Set(yLogs.map(r => String(r.studentId)));
  const missingReportNames = [...ySet].filter(id => !yLogSet.has(id)).map(id => byId[id]);

  res.json({
    date: today,
    missingAttendance: { count: missingAttendanceNames.length, names: missingAttendanceNames.slice(0, 10) },
    missingReportPrev: { date: yday, count: missingReportNames.length, names: missingReportNames.slice(0, 10) }
  });
};
