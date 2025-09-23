// server/services/cron/jobs/autoLeaveJob.js  ← [ADD]
const { getSettings, updateSettings, withRunKey } = require('../settingsService');
const { nowInTz, acquireLock, releaseLock } = require('../cronUtils');

async function runAutoLeave({ Setting, Services, overrideNow, force = false } = {}) {
  const s = await getSettings(Setting);
  const tz = s.timezone || 'Asia/Seoul';
  const now = overrideNow ? new Date(overrideNow) : nowInTz(tz).toJSDate();

  if (!s.autoLeaveEnabled && !force) return { skipped: true, reason: 'disabled' };

  const runKey = withRunKey(new Date(now), 'autoLeave');
  if (s.lastRunKeys?.autoLeave === runKey && !force) {
    return { skipped: true, reason: 'already-ran', runKey };
  }

  if (!(await acquireLock(Setting))) return { skipped: true, reason: 'locked' };

  try {
    let processed = 0, preview = [];
    if (s.dryRun) {
      // ⚠️ 여기서 '미리보기'만: 기존 쿼리 로직으로 대상자/레슨 목록 조회만 수행
      const { list, count } = await Services.previewAutoLeave({ limit: s.rateLimitPerRun }); // [REUSE] 기존 쿼리 연결
      processed = 0;
      preview = list;
    } else {
      // 실제 처리: 기존 서비스 로직 호출 (멱등 설계 권장)
      const result = await Services.performAutoLeave({ limit: s.rateLimitPerRun }); // [REUSE]
      processed = result.processed || 0;
      preview = result.preview || [];
    }

    // 상태 기록
    const next = {
      ...s,
      lastAutoLeaveRunAt: new Date(),
      lastRunKeys: { ...(s.lastRunKeys || {}), autoLeave: runKey }
    };
    await updateSettings(Setting, next, { updatedBy: 'cron:autoLeave' });
    return { ok: true, dryRun: !!s.dryRun, processed, preview, runKey };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally {
    await releaseLock(Setting);
  }
}

module.exports = { runAutoLeave };
