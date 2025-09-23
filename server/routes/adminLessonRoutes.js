// server/routes/adminLessonRoutes.js
// 기존 기능 유지 + (신규) /lessons(detail/create) 라우트 연결
// ※ 모델 직접 import(fallback) 없음. 컨트롤러에 있는 함수만 연결.

const express = require('express');
const router = express.Router();

const { requireAdminOrSuper } = require('../middleware/auth');
const lessons = require('../controllers/lessonsController');

// 크론 관련(기존 수동 실행/alias 유지)
const Setting = require('../models/Setting');
const { runAutoLeave } = require('../services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('../services/cron/jobs/dailyReportJob');
const Services = require('../services/cron/servicesAdapter');

/* =========================================================
 * 날짜별 레슨 목록 (기존)
 * ========================================================= */
router.get('/lessons', requireAdminOrSuper, lessons.listByDate);
router.get('/lessons/by-date', requireAdminOrSuper, lessons.listByDate);

/* =========================================================
 * (신규) 레슨 상세 - ProgressManager가 호출
 * GET /api/admin/lessons/detail?studentId=...&date=YYYY-MM-DD(옵션)
 * 컨트롤러의 getDetail이 있으면 연결
 * ========================================================= */
if (typeof lessons.getDetail === 'function') {
  router.get('/lessons/detail', requireAdminOrSuper, lessons.getDetail);
}

/* =========================================================
 * (신규) 레슨 생성/저장 - DailyReportEditor/Sender가 호출
 * POST /api/admin/lessons
 * 컨트롤러에 create / createLesson / upsert / saveDailyReport 등
 * 실제 구현된 함수명에 맞춰 우선순위로 연결
 * ========================================================= */
const createCandidates = [
  'create',            // 가장 일반적인 이름
  'createLesson',
  'upsertLesson',
  'saveDailyReport',
  'save',              // 프로젝트에 따라 다를 수 있어 후보로 포함
];

const createFnName = createCandidates.find((k) => typeof lessons[k] === 'function');

if (createFnName) {
  router.post('/lessons', requireAdminOrSuper, async (req, res, next) => {
    try {
      // 컨트롤러 함수가 res를 직접 쓰는 패턴도 고려
      const out = await lessons[createFnName](req, res, next);
      if (!res.headersSent) res.json(out);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ message: 'lessons create failed', error: String(e?.message || e) });
    }
  });
} else {
  // 컨트롤러에 생성 함수가 전혀 없을 때만 안내 (서버는 죽지 않도록)
  router.post('/lessons', requireAdminOrSuper, (req, res) => {
    res.status(404).json({
      message: 'lessonsController: create handler not found',
      need: 'Implement one of: create / createLesson / upsertLesson / saveDailyReport',
    });
  });
}

/* =========================================================
 * 출결 단건/업데이트 (기존)
 * ========================================================= */
router.get('/attendance/one', requireAdminOrSuper, lessons.getAttendanceOne);
router.post('/attendance/set-times', requireAdminOrSuper, lessons.setAttendanceTimes);

/* =========================================================
 * 자동 발송 ON/OFF (기존)
 * ========================================================= */
router.get('/settings/daily-auto', requireAdminOrSuper, lessons.getDailyAuto);
router.post('/settings/daily-auto', requireAdminOrSuper, lessons.setDailyAuto);

/* =========================================================
 * (기존) 수동 트리거: 자동하원 / 일일리포트
 * ========================================================= */
router.post('/lessons/auto-leave', requireAdminOrSuper, async (req, res) => {
  try {
    const out = await runAutoLeave({ Setting, Services });
    return res.json(out);
  } catch (e) {
    console.error('[admin.lessons/auto-leave]', e);
    return res.status(500).json({ message: 'auto-leave run failed', error: String(e?.message || e) });
  }
});

router.post('/lessons/send-daily', requireAdminOrSuper, async (req, res) => {
  try {
    const out = await runDailyReport({ Setting, Services });
    return res.json(out);
  } catch (e) {
    console.error('[admin.lessons/send-daily]', e);
    return res.status(500).json({ message: 'daily-report run failed', error: String(e?.message || e) });
  }
});

/* =========================================================
 * (기존 호환) 크론 설정/즉시실행 alias를 /api/admin에도 제공
 *   - GET/PUT /api/admin/cron-settings
 *   - POST   /api/admin/cron/run-now
 *   (운영에선 권한 미들웨어를 다시 켜세요)
 * ========================================================= */
const { seedFromEnvIfEmpty, getSettings, updateSettings } = require('../services/cron/settingsService');

router.get('/cron-settings', /*requireAdminOrSuper,*/ async (req, res) => {
  try {
    await seedFromEnvIfEmpty(Setting, process.env);
    const s = await getSettings(Setting);
    res.json(s);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'failed to load settings' });
  }
});

router.put('/cron-settings', /*requireAdminOrSuper,*/ async (req, res) => {
  try {
    const next = await updateSettings(Setting, req.body, { updatedBy: req.user?._id || 'admin' });
    res.json(next);
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Invalid settings' });
  }
});

router.post('/cron/run-now', /*requireAdminOrSuper,*/ async (req, res) => {
  const { type, overrideNow, force } = req.body || {};
  try {
    let out;
    if (type === 'autoLeave') out = await runAutoLeave({ Setting, Services, overrideNow, force });
    else if (type === 'dailyReport') out = await runDailyReport({ Setting, Services, overrideNow, force });
    else return res.status(400).json({ message: 'type must be autoLeave or dailyReport' });
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'run failed' });
  }
});

module.exports = router;