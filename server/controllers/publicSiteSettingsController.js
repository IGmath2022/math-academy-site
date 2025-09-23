// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

const DEFAULT_PUBLIC = {
  siteName: 'Math Academy',
  logoUrl: '',
  loginMessage: '',
  blogEnabled: true,
  banners: [], // [{imageUrl, href, title, enabled}]
  // NavBar 메뉴 설정
  menu_home_on: true,
  menu_blog_on: true,
  menu_materials_on: true,
  menu_contact_on: true,
  menu_news_on: true
};

function parseMaybe(str) {
  if (typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch { return null; }
}

async function readPublicSettings() {
  let doc = await Setting.findOne({ key: 'publicSite' }).lean();
  if (!doc) doc = await Setting.findOne({ name: 'publicSite' }).lean();

  let publicSettings = null;
  if (doc) {
    const fromValue = parseMaybe(doc.value);
    if (fromValue && typeof fromValue === 'object') publicSettings = fromValue;
    else if (doc.data && typeof doc.data === 'object') publicSettings = doc.data;
  }

  // 슈퍼설정에서 메뉴 설정 가져오기
  const menuSettings = {};
  const menuKeys = ['menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on', 'menu_news_on'];

  for (const key of menuKeys) {
    const setting = await Setting.findOne({ key }).lean();
    if (setting && setting.value) {
      menuSettings[key] = setting.value === 'true';
    }
  }

  // 기본값, 공개설정, 슈퍼설정 순으로 병합
  return { ...DEFAULT_PUBLIC, ...publicSettings, ...menuSettings };
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
    const settings = await readPublicSettings();
    res.json({ ok: true, settings: settings || DEFAULT_PUBLIC });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'failed to load public settings' });
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
