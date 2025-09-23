// server/services/cron/cronUtils.js
// ───────────────────────────────────────────────────────────
// 변경 요약:
// - 이전 버전은 Mongo 문서의 'value.lockUntil' 경로를 직접 $set 했는데,
//   value가 String 스키마면 캐스팅 에러가 났음.
// - 이제 settingsService의 read-modify-write(setLock)로 일원화.
// ───────────────────────────────────────────────────────────
const { DateTime } = require('luxon');
const { getSettings, setLock } = require('./settingsService');

function nowInTz(tz) {
  return DateTime.now().setZone(tz || 'Asia/Seoul');
}

async function acquireLock(Setting, ms = 5 * 60 * 1000) {
  const s = await getSettings(Setting, { useCache: false });
  const now = new Date();
  if (s.lockUntil && new Date(s.lockUntil) > now) {
    return false; // 이미 잠겨있음
  }
  const lockUntil = new Date(now.getTime() + ms);
  await setLock(Setting, lockUntil);
  return true;
}

async function releaseLock(Setting) {
  await setLock(Setting, null);
}

module.exports = { nowInTz, acquireLock, releaseLock };
