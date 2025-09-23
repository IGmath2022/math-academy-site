// server/routes/adminLessonRoutes.js
// 기존 기능 유지 + (신규) /lessons/detail 연결
// ※ 모델 직접 import(fallback)는 제거하여 MODULE_NOT_FOUND 방지

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
 * (신규) 레슨 상세 - 프런트 ProgressManager가 호출
 * GET /api/admin/lessons/detail?studentId=...&date=YYYY-MM-DD(옵션)
 * 컨트롤러에 구현된 getDetail을 그대로 연결
 * ========================================================= */
if (typeof lessons.getDetail === 'function') {
  router.get('/lessons/detail', requireAdminOrSuper, lessons.getDetail);
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
