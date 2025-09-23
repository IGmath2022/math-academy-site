// server/routes/superCronRoutes.js  ← [ADD]
const express = require('express');
const router = express.Router();
const { seedFromEnvIfEmpty, getSettings, updateSettings } = require('../services/cron/settingsService');
const { runAutoLeave } = require('../services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('../services/cron/jobs/dailyReportJob');
const Setting = require('../models/Setting');
// TODO: 관리자 인증 미들웨어 연결
// const { requireAdmin } = require('../middleware/auth');

const buildServicesAdapter = () => ({
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  // 여기만 2차에서 네 레포의 실제 서비스로 연결해 줄게
  previewAutoLeave: async ({ limit }) => ({ list: [], count: 0 }),
  performAutoLeave: async ({ limit }) => ({ processed: 0, preview: [] }),
  previewDailyReport: async ({ limit }) => ({ list: [], count: 0 }),
  performDailyReport: async ({ limit }) => ({ processed: 0, preview: [] }),
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
});

router.get('/cron-settings', /*requireAdmin,*/ async (req, res) => {
  await seedFromEnvIfEmpty(Setting, process.env);
  const s = await getSettings(Setting);
  res.json(s);
});

router.put('/cron-settings', /*requireAdmin,*/ async (req, res) => {
  try {
    const next = await updateSettings(Setting, req.body, { updatedBy: req.user?._id || 'admin' });
    res.json(next);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Invalid settings' });
  }
});

// Run now: type = autoLeave | dailyReport
router.post('/cron/run-now', /*requireAdmin,*/ async (req, res) => {
  const { type, overrideNow, force } = req.body || {};
  const Services = buildServicesAdapter();
  try {
    let out;
    if (type === 'autoLeave') out = await runAutoLeave({ Setting, Services, overrideNow, force });
    else if (type === 'dailyReport') out = await runDailyReport({ Setting, Services, overrideNow, force });
    else return res.status(400).json({ message: 'type must be autoLeave or dailyReport' });
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: e.message || 'run failed' });
  }
});

module.exports = router;
