// server/routes/superCronRoutes.js  ← [ADD]
const express = require('express');
const router = express.Router();
const { seedFromEnvIfEmpty, getSettings, updateSettings } = require('../services/cron/settingsService');
const { runAutoLeave } = require('../services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('../services/cron/jobs/dailyReportJob');
const Setting = require('../models/Setting');
// TODO: 관리자 인증 미들웨어 연결
// const { requireAdmin } = require('../middleware/auth');

const buildServicesAdapter = () => {
  return require('../services/cron/servicesAdapter');
};

router.get('/cron-settings', /*requireAdmin,*/ async (req, res) => {
  await seedFromEnvIfEmpty(Setting, process.env);
  const s = await getSettings(Setting);
  res.json(s);
});

router.put('/cron-settings', /*requireAdmin,*/ async (req, res) => {
  try {
    const next = await updateSettings(Setting, req.body, { updatedBy: req.user?._id || 'admin' });

    // 크론 설정이 변경되면 실행 중인 크론 작업들을 업데이트
    if (global.updateCronJobs) {
      try {
        await global.updateCronJobs();
        console.log('[superCronRoutes] 크론 작업이 업데이트되었습니다.');
      } catch (e) {
        console.error('[superCronRoutes] 크론 업데이트 실패:', e);
      }
    }

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

// Reset lastRunKeys for a specific date
router.post('/cron/reset-run-keys', /*requireAdmin,*/ async (req, res) => {
  try {
    const { date, type } = req.body || {};
    const current = await getSettings(Setting, { useCache: false });

    if (date && type) {
      // 특정 날짜와 타입의 runKey 제거
      const runKey = `${date}@${type}`;
      const newLastRunKeys = { ...(current.lastRunKeys || {}) };
      delete newLastRunKeys[type];

      const updated = await updateSettings(Setting, { lastRunKeys: newLastRunKeys }, { updatedBy: 'admin' });
      console.log(`[resetRunKeys] ${runKey} 제거됨`);
      res.json({ message: `${runKey} 제거됨`, settings: updated });
    } else {
      // 모든 lastRunKeys 초기화
      const updated = await updateSettings(Setting, { lastRunKeys: {} }, { updatedBy: 'admin' });
      console.log('[resetRunKeys] 모든 lastRunKeys 초기화됨');
      res.json({ message: '모든 lastRunKeys 초기화됨', settings: updated });
    }
  } catch (e) {
    res.status(500).json({ message: e.message || 'reset failed' });
  }
});

module.exports = router;
