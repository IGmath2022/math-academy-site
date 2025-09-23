// server/routes/adminLessonRoutes.js
// ───────────────────────────────────────────────────────────
// 기존 엔드포인트 보존 + (신규) 크론 설정/즉시실행을 /api/admin 경로로 alias 추가
// ───────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const { requireAdminOrSuper } = require('../middleware/auth');

// 기존 컨트롤러 (출결/리포트 토글 등)
const lessons = require('../controllers/lessonsController');

// DB Settings 및 잡 실행기
const Setting = require('../models/Setting');
const { seedFromEnvIfEmpty, getSettings, updateSettings } = require('../services/cron/settingsService');
const { runAutoLeave } = require('../services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('../services/cron/jobs/dailyReportJob');
const Services = require('../services/cron/servicesAdapter');

/* =========================================================
 * 날짜별 레슨 목록 (하위호환 포함)
 * ========================================================= */
router.get('/lessons', requireAdminOrSuper, lessons.listByDate);
router.get('/lessons/by-date', requireAdminOrSuper, lessons.listByDate);

/* =========================================================
 * 출결 수동 조회/수정
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
    console.error('[admin.auto-leave]', e);
    return res.status(500).json({ message: 'auto-leave run failed', error: String(e?.message || e) });
  }
});

router.post('/lessons/send-daily', requireAdminOrSuper, async (req, res) => {
  try {
    const out = await runDailyReport({ Setting, Services });
    return res.json(out);
  } catch (e) {
    console.error('[admin.send-daily]', e);
    return res.status(500).json({ message: 'daily-report run failed', error: String(e?.message || e) });
  }
});

/* =========================================================
 * (신규) alias: 크론 설정/즉시실행을 /api/admin 경로로도 제공
 *   - GET/PUT /api/admin/cron-settings
 *   - POST   /api/admin/cron/run-now
 *   (서버가 /api/super를 아직 배포 못했을 때를 위한 호환 경로)
 * ========================================================= */
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
