// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');
const { buildDailyTemplateBody, makeTwoLineTitle } = require('../utils/formatDailyReport');
const { issueToken } = require('../utils/reportToken');
// 리포트 전용 발송기 (등하원용과 분리)
const { sendReportAlimtalk } = require('../utils/alimtalkReport');

const KST = 'Asia/Seoul';
const { Types } = mongoose;

// ====== 공용 ======
const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';
async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}
function getDailyTplCodeFallback() {
  if (process.env.DAILY_REPORT_TPL_CODE) return process.env.DAILY_REPORT_TPL_CODE;
  return null;
}
const isValidId = (v) => {
  const s = String(v || '');
  return Types.ObjectId.isValid(s);
};
const toId = (v) => (isValidId(v) ? new Types.ObjectId(String(v)) : null);

// ====== 날짜별 목록(등원 ∪ 해당일 로그보유) ======
exports.listByDate = async (req, res) => {
  try {
    const date = (req.query.date || moment().tz(KST).format('YYYY-MM-DD'));

    // 1) 등원/하원 기록 수집
    const inRecs = await Attendance.find({ date, type: 'IN' }).lean();
    const outRecs = await Attendance.find({ date, type: 'OUT' }).lean();

    // 2) 리포트 로그 수집(해당일)
    const logs = await LessonLog.find({ date }).lean();

    // 3) 학생 id 집합 (유효 ObjectId만)
    const inIds = inRecs.map(r => r?.userId).filter(isValidId).map(String);
    const outIds = outRecs.map(r => r?.userId).filter(isValidId).map(String);
    const logIds = logs.map(l => l?.studentId).filter(isValidId).map(String);

    const idSet = new Set([...inIds, ...outIds, ...logIds]);
    const ids = Array.from(idSet).filter(isValidId);

    if (ids.length === 0) {
      return res.json({ date, items: [] });
    }

    // 4) 학생 정보 / 로그 맵
    const users = await User.find({ _id: { $in: ids.map(toId).filter(Boolean) } }).lean();
    const byId = Object.fromEntries(users.map(u => [String(u._id), u]));
    const logByStudent = Object.fromEntries(
      logs
        .filter(l => isValidId(l.studentId))
        .map(l => [String(l.studentId), l])
    );

    // 5) 당일 학생별 IN/OUT 시간 맵
    const byUserType = {};
    [...inRecs, ...outRecs].forEach(r => {
      const uid = isValidId(r?.userId) ? String(r.userId) : null;
      if (!uid) return;
      byUserType[uid] = byUserType[uid] || {};
      if (r?.type) byUserType[uid][r.type] = r.time?.slice(0, 5) || '';
    });

    // 6) 응답 아이템 구성
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

    return res.json({ date, items });
  } catch (err) {
    console.error('[lessonsController.listByDate] 500:', err);
    return res.status(500).json({ message: '리스트 조회 중 오류', error: String(err?.message || err) });
  }
};

// ====== 리포트 1건 상세(학생+날짜) ======
exports.getDetail = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    if (!studentId || !date || !isValidId(studentId)) {
      return res.status(400).json({ message: 'studentId(ObjectId), date 필수' });
    }
    const log = await LessonLog.findOne({ studentId, date }).lean();
    res.json(log || {});
  } catch (err) {
    console.error('[lessonsController.getDetail] 500:', err);
    res.status(500).json({ message: '상세 조회 오류', error: String(err?.message || err) });
  }
};

// ====== 작성/수정(업서트) ======
exports.createOrUpdate = async (req, res) => {
  try {
    const body = req.body || {};
    const { studentId, date } = body;
    if (!studentId || !date || !isValidId(studentId)) {
      return res.status(400).json({ message: 'studentId(ObjectId), date 필수' });
    }

    if (typeof body.feedback === 'string' && body.feedback.length > 1000) {
      body.feedback = body.feedback.slice(0, 999) + '…';
    }

    const doc = await LessonLog.findOneAndUpdate(
      { studentId, date },
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, id: doc._id, doc });
  } catch (err) {
    console.error('[lessonsController.createOrUpdate] 500:', err);
    res.status(500).json({ message: '업서트 오류', error: String(err?.message || err) });
  }
};

// ====== 예약 대기 목록 ======
exports.listPending = async (_req, res) => {
  try {
    const now = new Date();
    const items = await LessonLog.find({
      notifyStatus: '대기',
      scheduledAt: { $ne: null, $lte: now }
    }).limit(200).lean();
    res.json(items);
  } catch (err) {
    console.error('[lessonsController.listPending] 500:', err);
    res.status(500).json({ message: '대기 목록 오류', error: String(err?.message || err) });
  }
};

// ====== 1건 발송 ======
exports.sendOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'id(ObjectId) 필요' });

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

    // 강조형 2줄 타이틀 + 본문(템플릿과 1:1)
    const emtitle = makeTwoLineTitle(student.name, log.course || '', dateLabel, 23);
    const message = buildDailyTemplateBody({
      course: log.course || '-',
      book: log.book || '-',
      content: log.content || '',
      homework: log.homework || '',
      feedback: log.feedback || ''
    });

    // 개인화 버튼 링크
    const code = String(log._id);
    const base = REPORT_BASE.replace(/\/+$/, '');
    const button = {
      name: '리포트 보기',
      url_mobile: `${base}/r/${code}`,
      url_pc:     `${base}/r/${code}`
    };

    const ok = await sendReportAlimtalk(student.parentPhone, tpl, {
      emtitle,
      message,
      // 내부 재조립 대비 원자료도 전달
      name:     student.name,
      course:   log.course || '-',
      date:     dateLabel,
      book:     log.book || '-',
      content:  log.content || '',
      homework: log.homework || '',
      feedback: log.feedback || '',
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
  } catch (err) {
    console.error('[lessonsController.sendOne] 500:', err);
    res.status(500).json({ message: '단건 발송 오류', error: String(err?.message || err) });
  }
};

// ====== 선택 발송(여러 건) ======
exports.sendSelected = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids 배열 필요' });
    }

    let sent = 0, skipped = 0, failed = 0;
    for (const _id of ids) {
      try {
        if (!isValidId(_id)) { failed++; continue; }
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
  } catch (err) {
    console.error('[lessonsController.sendSelected] 500:', err);
    res.status(500).json({ message: '선택 발송 오류', error: String(err?.message || err) });
  }
};

// ====== 자동 발송(예약분) ======
exports.sendBulk = async (_req, res) => {
  try {
    const list = await LessonLog.find({
      notifyStatus: '대기',
      scheduledAt: { $ne: null, $lte: new Date() }
    }).select('_id').lean();

    let sent = 0, failed = 0;
    for (const item of list) {
      try {
        const _id = String(item._id);
        const log = await LessonLog.findById(_id);
        if (!log) { failed++; continue; }
        if (log.notifyStatus === '발송') { continue; }

        const fakeReq = { params: { id: _id } };
        const fakeRes = { json: () => {}, status: () => ({ json: () => {} }) };
        await exports.sendOne(fakeReq, fakeRes);

        const fresh = await LessonLog.findById(_id).lean();
        (fresh?.notifyStatus === '발송') ? sent++ : failed++;
      } catch {
        failed++;
      }
    }
    res.json({ ok: true, sent, failed });
  } catch (err) {
    console.error('[lessonsController.sendBulk] 500:', err);
    res.status(500).json({ message: '자동 발송 오류', error: String(err?.message || err) });
  }
};
