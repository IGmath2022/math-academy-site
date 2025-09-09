// server/controllers/lessonsController.js
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Setting = require('../models/Setting');
const LessonLog = require('../models/LessonLog');
const NotificationLog = require('../models/NotificationLog');
const { sendReportAlimtalk } = require('../utils/alimtalkReport');

const KST = 'Asia/Seoul';
const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';

// 공통: 설정 조회
async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}

// 날짜별 목록(등원 ∪ 해당일 로그보유)
exports.listByDate = async (req, res) => {
  try {
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
      byUserType[k][r.type] = (r.time || '').slice(0, 5);
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
  } catch (e) {
    console.error('[lessonsController.listByDate] ERR:', e);
    res.status(500).json({ message: '목록 조회 오류', error: String(e?.message || e) });
  }
};

// 학생+날짜 상세
exports.getDetail = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });
    const log = await LessonLog.findOne({ studentId, date }).lean();
    res.json(log || {});
  } catch (e) {
    console.error('[lessonsController.getDetail] ERR:', e);
    res.status(500).json({ message: '상세 조회 오류', error: String(e?.message || e) });
  }
};

// 작성/수정(업서트)
exports.createOrUpdate = async (req, res) => {
  try {
    const body = req.body || {};
    const { studentId, date } = body;
    if (!studentId || !date) return res.status(400).json({ message: 'studentId, date 필수' });

    if (typeof body.feedback === 'string' && body.feedback.length > 2000) {
      body.feedback = body.feedback.slice(0, 1999) + '…';
    }

    const doc = await LessonLog.findOneAndUpdate(
      { studentId, date },
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, id: doc._id, doc });
  } catch (e) {
    console.error('[lessonsController.createOrUpdate] ERR:', e);
    res.status(500).json({ message: '저장 오류', error: String(e?.message || e) });
  }
};

// 예약 대기 목록
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
    res.status(500).json({ message: '대기 목록 오류', error: String(e?.message || e) });
  }
};

// 단건 발송
exports.sendOne = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[ADMIN][LESSONS] POST /send-one/:id', id);

    const log = await LessonLog.findById(id);
    if (!log) return res.status(404).json({ message: 'LessonLog 없음' });
    if (log.notifyStatus === '발송') {
      return res.status(409).json({ ok: false, message: '이미 발송됨' });
    }

    const student = await User.findById(log.studentId);
    if (!student || !student.parentPhone) {
      return res.status(400).json({ message: '학부모 연락처 없음' });
    }

    // 템플릿 코드: .env > DB(settings.daily_tpl_code)
    const tplFromEnv = process.env.DAILY_REPORT_TPL_CODE || '';
    const tplFromDb = await getSetting('daily_tpl_code', '');
    const templateCode = tplFromEnv || tplFromDb;
    if (!templateCode) {
      return res.status(400).json({ message: '리포트 템플릿 코드 미설정( DAILY_REPORT_TPL_CODE 또는 settings.daily_tpl_code )' });
    }

    // 템플릿 변수 조립
    const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
    const dateLabel = m.format('YYYY.MM.DD(ddd)');

    const v = {
      학생명: student.name || '',
      과정: log.course || '-',
      수업일자: dateLabel,
      교재: log.book || '-',
      수업요약: (log.content || '').trim(),
      과제요약: (log.homework || '').trim(),
      피드백요약: (log.feedback || '').trim(),
      code: String(log._id)
    };

    // 실제 전송
    const ok = await sendReportAlimtalk(student.parentPhone, templateCode, v);

    // 발송 로그
    await NotificationLog.create({
      studentId: log.studentId,
      type: '일일리포트',
      status: ok ? '성공' : '실패',
      code: ok ? '0' : 'ERR',
      message: ok ? 'OK' : '알림톡 발송 실패',
      payloadSize: Buffer.byteLength(JSON.stringify(v), 'utf8')
    });

    // 상태 갱신
    log.notifyStatus = ok ? '발송' : '실패';
    log.notifyLog = ok ? 'OK' : '알림톡 발송 실패';
    await log.save();

    res.json({ ok, id: log._id });
  } catch (e) {
    console.error('[lessonsController.sendOne] 500:', e);
    res.status(500).json({ message: '단건 발송 오류', error: String(e?.message || e) });
  }
};

// 선택 발송
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

        // 재사용: sendOne 로직 호출
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
    console.error('[lessonsController.sendSelected] 500:', e);
    res.status(500).json({ message: '선택 발송 오류', error: String(e?.message || e) });
  }
};

// 예약분 일괄 발송(크론/수동)
exports.sendBulk = async (_req, res) => {
  try {
    const list = await LessonLog.find({
      notifyStatus: '대기',
      scheduledAt: { $ne: null, $lte: new Date() }
    }).select('_id').lean();

    let sent = 0, failed = 0;
    for (const item of list) {
      try {
        const log = await LessonLog.findById(item._id);
        if (!log) { failed++; continue; }
        if (log.notifyStatus === '발송') continue;

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
    console.error('[lessonsController.sendBulk] 500:', e);
    res.status(500).json({ message: '예약분 발송 오류', error: String(e?.message || e) });
  }
};
