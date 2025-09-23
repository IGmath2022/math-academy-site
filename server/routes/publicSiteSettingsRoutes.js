// server/routes/publicSiteSettingsRoutes.js
const express = require('express');
const router = express.Router();

// 공용 Setting 모델 사용 (key-value 저장소)
const Setting = require('../models/Setting');

// 안전한 기본값 (DB 문서 없을 때)
const DEFAULT_PUBLIC = {
  siteName: 'Math Academy',
  logoUrl: '',
  loginMessage: '',
  blogEnabled: true,
  banners: [],
};

// DB에서 value(JSON) 또는 data(Object) 읽기
function parseMaybe(str) {
  if (typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch { return null; }
}

async function readPublicSettings() {
  let doc = await Setting.findOne({ key: 'publicSite' }).lean();
  if (!doc) doc = await Setting.findOne({ name: 'publicSite' }).lean();
  if (!doc) return null;

  const fromValue = parseMaybe(doc.value);
  if (fromValue && typeof fromValue === 'object') return fromValue;
  if (doc.data && typeof doc.data === 'object') return doc.data;
  return null;
}

async function writePublicSettings(valueObj, updatedBy = 'system') {
  const json = JSON.stringify(valueObj);
  await Setting.findOneAndUpdate(
    { key: 'publicSite' },
    { key: 'publicSite', value: json, data: valueObj, updatedBy, updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * GET /api/public-site-settings
 * GET /api/site/public-settings
 *  → app.js에서 각각 마운트됨. 여기선 반드시 상대경로('/')만 사용!
 */
router.get('/', async (req, res) => {
  try {
    const v = await readPublicSettings();
    res.json(v || DEFAULT_PUBLIC);
  } catch (e) {
    res.status(500).json({ message: 'failed to load public settings' });
  }
});

/**
 * (옵션) 공개 설정 저장 — 관리자가 사용하는 경우에만 라우팅하세요.
 * 필요 없으면 주석 처리해도 됩니다.
 */
router.put('/', /* requireAdminOrSuper, */ async (req, res) => {
  try {
    const next = { ...(await readPublicSettings()) || DEFAULT_PUBLIC, ...(req.body || {}) };
    await writePublicSettings(next, req.user?._id || 'admin');
    res.json(next);
  } catch (e) {
    res.status(400).json({ message: 'failed to save public settings' });
  }
});

module.exports = router;
