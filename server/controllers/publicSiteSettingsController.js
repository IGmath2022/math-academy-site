// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

// 안전 기본값
const DEFAULT_PUBLIC = {
  siteName: 'Math Academy',
  logoUrl: '',
  loginMessage: '',
  blogEnabled: true,
  banners: [],
};

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

// GET /
exports.getPublic = async (req, res) => {
  try {
    const v = await readPublicSettings();
    res.json(v || DEFAULT_PUBLIC);
  } catch (e) {
    res.status(500).json({ message: 'failed to load public settings' });
  }
};

// PUT /
exports.putPublic = async (req, res) => {
  try {
    const cur = (await readPublicSettings()) || DEFAULT_PUBLIC;
    const next = { ...cur, ...(req.body || {}) };
    await writePublicSettings(next, req.user?._id || 'admin');
    res.json(next);
  } catch (e) {
    res.status(400).json({ message: 'failed to save public settings' });
  }
};
