// server/services/cron/jobs/dailyReportJob.js  ← [ADD]
const { getSettings, updateSettings, withRunKey } = require('../settingsService');
const { nowInTz, acquireLock, releaseLock } = require('../cronUtils');

async function runDailyReport({ Setting, Services, overrideNow, force = false } = {}) {
  const s = await getSettings(Setting);
  const tz = s.timezone || 'Asia/Seoul';
  const now = overrideNow ? new Date(overrideNow) : nowInTz(tz).toJSDate();

  if (!s.autoReportEnabled && !force) return { skipped: true, reason: 'disabled' };

  const runKey = withRunKey(new Date(now), 'dailyReport');
  if (s.lastRunKeys?.dailyReport === runKey && !force) {
    return { skipped: true, reason: 'already-ran', runKey };
  }

  if (!(await acquireLock(Setting))) return { skipped: true, reason: 'locked' };

  try {
    let processed = 0, preview = [];
    if (s.dryRun) {
      const { list, count } = await Services.previewDailyReport({ limit: s.rateLimitPerRun }); // [REUSE]
      processed = 0;
      preview = list;
    } else {
      const result = await Services.performDailyReport({ limit: s.rateLimitPerRun }); // [REUSE]
      processed = result.processed || 0;
      preview = result.preview || [];
    }

    const next = {
      ...s,
      lastAutoReportRunAt: new Date(),
      lastRunKeys: { ...(s.lastRunKeys || {}), dailyReport: runKey }
    };
    await updateSettings(Setting, next, { updatedBy: 'cron:dailyReport' });
    return { ok: true, dryRun: !!s.dryRun, processed, preview, runKey };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally {
    await releaseLock(Setting);
  }
}

module.exports = { runDailyReport };
