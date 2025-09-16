// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');
const ClassGroup = require('../models/ClassGroup') || null; // 없으면 null
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
 *   GET /api/staff/lessons?date=YYYY-MM-DD&scope=present|all|missing
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
    ids = [...presentSet];
    users = await User.find({ _id: { $in: ids } }).lean();
  } else {
    const allStudents = await User.find({
      role: 'student',
      $or: [{ active: true }, { active: { $exists: false } }]
    }).select('_id name').lean();

    const allIds = allStudents.map(u => String(u._id));
    if (scope === 'all') {
      ids = allIds;
    } else if (scope === 'missing') {
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
      missingIn: !checkIn,
      hasAttendance,
      missingAttendance: !hasAttendance,
      scopeApplied: scope,
    };
  });

  items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));

  res.json({ date, scope, items });
};

/* =========================================================
 * 리포트 1건 상세(학생+날짜)
 * ========================================================= */
exports.getDetail = async (req, res) => {
  const { studentId, date } = req.query;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });
  const log = await LessonLog.findOne({ studentId, date }).lean();
  if (!log) return res.json({});
  res.json({ ...log, studyTimeMin: log.durationMin ?? null });
};

/* =========================================================
 * 작성/수정(업서트)
 * ========================================================= */
exports.createOrUpdate = async (req, res) => {
  const body = { ...(req.body || {}) };
  const { studentId, date } = body;
  if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

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

/* =========================================================
 * 예약 대기 목록
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
 * ========================================================= */
exports.sendOne = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await LessonLog.findById(id);
    if (!log) return res.status(404).json({ message: 'LessonLog 없음' });
    if (log.notifyStatus === '발송') return res.status(409).json({ ok: false, message: '이미 발송됨' });

    const student = await User.findById(log.studentId);
    if (!student || !student.parentPhone) return res.status(400).json({ message: '학부모 연락처 없음' });

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

    res.json({ ok, id: log._id });
  } catch (e) {
    console.error('[lessonsController.sendOne]', e);
    res.status(500).json({ message: '단건 발송 오류', error: String(e?.message || e) });
  }
};

/* =========================================================
 * 선택 발송(여러 건)
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
 * 출결 수동 수정 API
 * -----------------------------------------------------------------*/
function toHHMMSS(t) {
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return null;
}
exports.getAttendanceOne = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

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
    console.error('[lessonsController.getAttendanceOne]', e);
    res.status(500).json({ message: '출결 조회 오류', error: String(e?.message || e) });
  }
};

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

/* =========================
 * 자동발송 ON/OFF 설정 API
 * ========================= */
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

/* =========================
 * 🔹 강사용 위젯: 오늘 알림
 *   GET /api/staff/alerts/today
 *   반환 형식을 배열 기반으로 제공(위젯 호환)
 * ========================= */
exports.getTodayAlerts = async (req, res) => {
  try {
    const today = moment().tz(KST).format('YYYY-MM-DD');
    // 활성 학생
    const students = await User.find({
      role: 'student',
      $or: [{ active: true }, { active: { $exists: false } }]
    }).select('_id name').lean();

    const ids = students.map(s => s._id);
    const [ins, logs] = await Promise.all([
      Attendance.find({ date: today, type: 'IN', userId: { $in: ids } }).select('userId').lean(),
      LessonLog.find({ date: today, studentId: { $in: ids } }).select('studentId').lean()
    ]);
    const inSet = new Set(ins.map(r => String(r.userId)));
    const logSet = new Set(logs.map(r => String(r.studentId)));

    // 오늘 미출결: IN이 없는 학생들
    const missingAttendance = students
      .filter(s => !inSet.has(String(s._id)))
      .map(s => s.name);

    // 어제(이전 영업일 개념은 생략) 등원했는데 리포트 없는 학생
    const y = moment().tz(KST).subtract(1, 'day').format('YYYY-MM-DD');
    const [yIns, yLogs] = await Promise.all([
      Attendance.find({ date: y, type: 'IN', userId: { $in: ids } }).select('userId').lean(),
      LessonLog.find({ date: y, studentId: { $in: ids } }).select('studentId').lean()
    ]);
    const yInSet = new Set(yIns.map(r => String(r.userId)));
    const yLogSet = new Set(yLogs.map(r => String(r.studentId)));
    const missingReportPrev = students
      .filter(s => yInSet.has(String(s._id)) && !yLogSet.has(String(s._id)))
      .map(s => s.name);

    res.json({
      missingAttendance, // 배열
      missingReportPrev: { date: y, names: missingReportPrev } // 배열 보유
    });
  } catch (e) {
    console.error('[lessonsController.getTodayAlerts]', e);
    res.status(500).json({ message: '알림 위젯 조회 실패', error: String(e?.message || e) });
  }
};

/* =========================
 * 🔹 강사용 위젯: 월 로그 요약
 *   GET /api/staff/lessons/month-logs?month=YYYY-MM
 * ========================= */
exports.getMonthLogs = async (req, res) => {
  try {
    const month = (req.query.month || moment().tz(KST).format('YYYY-MM'));
    const start = `${month}-01`;
    const end = moment.tz(start, 'YYYY-MM-DD', KST).endOf('month').format('YYYY-MM-DD');

    // 범위 포함: date 문자열 비교로 간단 처리
    const dateRegex = new RegExp(`^${month}-\\d{2}$`);
    let q = { date: { $regex: dateRegex } };

    // 강사 스코프(본인 반 학생만) — ClassGroup 사용 가능 시
    if (req.user?.role === 'teacher' && ClassGroup) {
      const groups = await ClassGroup.find({ teachers: req.user.id, active: true })
        .select('students')
        .lean();
      const allowed = new Set(groups.flatMap(g => g.students?.map(String) || []));
      if (allowed.size > 0) q.studentId = { $in: Array.from(allowed) };
      else q.studentId = { $in: [] }; // 소속 없으면 빈 결과
    }

    const rows = await LessonLog.find(q)
      .select('studentId date teacher classType course')
      .lean();

    res.json({ month, count: rows.length, items: rows });
  } catch (e) {
    console.error('[lessonsController.getMonthLogs]', e);
    res.status(500).json({ message: '월 로그 조회 실패', error: String(e?.message || e) });
  }
};

/* =========================
 * 🔹 강사용 위젯: 워크로드 메트릭
 *   GET /api/staff/metrics/workload
 *   - teacher: 본인 담당 반 수 / 학생 수
 *   - admin/super: 활성 반 수 / 전체 활성 학생 수
 * ========================= */
exports.getWorkloadMetrics = async (req, res) => {
  try {
    const role = req.user?.role;
    let classCount = 0;
    let studentCount = 0;

    if (ClassGroup) {
      if (role === 'teacher') {
        const groups = await ClassGroup.find({ teachers: req.user.id, active: true }).lean();
        classCount = groups.length;
        const studentSet = new Set(groups.flatMap(g => (g.students || []).map(s => String(s))));
        studentCount = studentSet.size;
      } else {
        const groups = await ClassGroup.find({ active: true }).lean();
        classCount = groups.length;
        const studentSet = new Set(groups.flatMap(g => (g.students || []).map(s => String(s))));
        if (studentSet.size > 0) {
          // 활성 학생만 카운트 하고 싶으면 User 조회
          const rows = await User.find({ _id: { $in: Array.from(studentSet) }, role: 'student', $or: [{active:true},{active:{$exists:false}}] }).select('_id').lean();
          studentCount = rows.length;
        } else {
          // 그룹에 배정되지 않은 활성 학생도 포함할지 정책에 따라 조정 가능
          const rows = await User.find({ role: 'student', $or: [{active:true},{active:{$exists:false}}] }).select('_id').lean();
          studentCount = rows.length;
        }
      }
    } else {
      // ClassGroup 모델이 없는 경우: 전체 학생 수만
      const rows = await User.find({ role: 'student', $or: [{active:true},{active:{$exists:false}}] }).select('_id').lean();
      studentCount = rows.length;
    }

    res.json({
      ok: true,
      classCount,
      studentCount,
      // 프론트 호환을 위해 별칭도 제공
      classes: classCount,
      students: studentCount,
      myClasses: classCount,
      myStudentsCount: studentCount,
    });
  } catch (e) {
    console.error('[lessonsController.getWorkloadMetrics]', e);
    res.status(500).json({ message: '워크로드 조회 실패', error: String(e?.message || e) });
  }
};
