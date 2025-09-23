// server/services/cron/settingsService.js
// ───────────────────────────────────────────────────────────
// 변경 요약 (CastError 해결):
// - DB에 저장 시 value(문자열)와 data(객체) 둘 다 저장
//   * value: JSON.stringify(설정객체)  ← 기존 스키마가 String이어도 안전
//   * data : 설정객체(그대로)         ← Mixed/임의 필드일 때 사용
// - 읽을 때는 value 문자열이 있으면 JSON.parse 시도 → 실패하면 data 사용
// - 락/갱신은 이 파일의 updateSettings()를 통해 read-modify-write로 일원화
// - CRON 검증은 node-cron.validate 사용 (5/6필드 모두 허용)
// ───────────────────────────────────────────────────────────

const nodeCron = require('node-cron');

const DEFAULTS = () => ({
  autoLeaveEnabled: false,
  autoLeaveCron: '0 23 * * *',          // 매일 23:00
  autoReportEnabled: false,
  autoReportCron: '30 9 * * *',         // 매일 09:30
  dryRun: true,
  timezone: 'Asia/Seoul',
  rateLimitPerRun: 500,
  lastAutoLeaveRunAt: null,
  lastAutoReportRunAt: null,
  lockUntil: null,
  lastRunKeys: {}                        // { autoLeave: 'YYYY-MM-DD@autoLeave', dailyReport: '...' }
});

let _cache = null;
let _cacheAt = 0;
const CACHE_MS = 30 * 1000;

function validateCronOrThrow(expr) {
  if (!nodeCron.validate(expr)) throw new Error(`Invalid CRON: ${expr}`);
}

function normalize(input) {
  const d = DEFAULTS();
  const out = { ...d, ...(input || {}) };
  if (!out.timezone) out.timezone = 'Asia/Seoul';
  if (typeof out.rateLimitPerRun !== 'number' || out.rateLimitPerRun <= 0) out.rateLimitPerRun = 500;
  validateCronOrThrow(out.autoLeaveCron);
  validateCronOrThrow(out.autoReportCron);
  return out;
}

function safeParseMaybe(str) {
  if (typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch (_) { return null; }
}

async function readRaw(Setting) {
  // key='cron' 우선, 과거 name='cron'도 허용
  let doc = await Setting.findOne({ key: 'cron' }).lean();
  if (!doc) doc = await Setting.findOne({ name: 'cron' }).lean();
  if (!doc) return null;

  // 우선 value(문자열) → JSON.parse, 실패 시 data(객체) 사용
  const fromValue = safeParseMaybe(doc.value);
  if (fromValue && typeof fromValue === 'object') return fromValue;

  if (doc.data && typeof doc.data === 'object') return doc.data;

  // value가 문자열이지만 JSON이 아니면 빈 설정으로 취급
  return null;
}

async function writeRaw(Setting, valueObj, updatedBy = 'system') {
  // 항상 두 군데에 기록: value(JSON 문자열), data(객체)
  const json = JSON.stringify(valueObj);
  await Setting.findOneAndUpdate(
    { key: 'cron' },
    {
      key: 'cron',
      value: json,        // 스키마가 String이어도 OK
      data: valueObj,     // Mixed/임의필드면 저장됨(STRICT=false 또는 Mixed)
      updatedBy,
      updatedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedFromEnvIfEmpty(Setting, env) {
  const exists = await readRaw(Setting);
  if (exists) return false;

  const seeded = normalize({
    autoLeaveEnabled: env.CRON_ENABLED_AUTO_LEAVE === '1' || env.CRON_ENABLED_AUTO_LEAVE === 'true',
    autoLeaveCron: env.AUTO_LEAVE_CRON || '0 23 * * *',
    autoReportEnabled: env.DAILY_REPORT_AUTO === '1' || env.DAILY_REPORT_AUTO === 'true',
    autoReportCron: env.DAILY_REPORT_CRON || '30 9 * * *',
    dryRun: env.DRY_RUN === '1' || env.DRY_RUN === 'true' || true,
    timezone: env.CRON_TIMEZONE || 'Asia/Seoul',
    rateLimitPerRun: Number(env.RATE_LIMIT_PER_RUN || 500),
  });

  await writeRaw(Setting, seeded, 'seed');
  return true;
}

async function getSettings(Setting, { useCache = true } = {}) {
  const now = Date.now();
  if (useCache && _cache && (now - _cacheAt) < CACHE_MS) return _cache;

  const raw = await readRaw(Setting);
  const merged = normalize(raw || {});
  _cache = merged;
  _cacheAt = now;
  return merged;
}

async function updateSettings(Setting, patch, { updatedBy } = {}) {
  const current = await getSettings(Setting, { useCache: false });
  const next = normalize({ ...current, ...patch });
  await writeRaw(Setting, next, updatedBy || 'admin');
  _cache = next;
  _cacheAt = Date.now();
  return next;
}

function withRunKey(dateObj, jobName) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}@${jobName}`;
}

/**
 * 락 제어 (cronUtils에서 사용)
 * - read-modify-write 방식으로 lockUntil 필드만 안전하게 갱신
 */
async function setLock(Setting, lockUntil) {
  const current = await getSettings(Setting, { useCache: false });
  current.lockUntil = lockUntil;
  await writeRaw(Setting, current, 'lock');
  _cache = current;
  _cacheAt = Date.now();
}

module.exports = {
  DEFAULTS,
  seedFromEnvIfEmpty,
  getSettings,
  updateSettings,
  withRunKey,
  setLock,
};
