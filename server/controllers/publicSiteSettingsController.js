const Setting = require('../models/Setting');

const DEFAULT_PUBLIC = {
  siteName: 'Math Academy',
  logoUrl: '',
  loginMessage: '',
  blogEnabled: true,
  banners: [], // [{imageUrl, href, title, enabled}]
  menu_home_on: true,
  menu_blog_on: true,
  menu_materials_on: true,
  menu_contact_on: true,
  menu_news_on: true,
  menu_teachers_on: false,
  site_theme_color: '#2d4373',
  site_theme_mode: 'light',
  default_class_name: 'IG Math',
  blog_show: true,
  home_sections: [],
  hero_title: '',
  hero_subtitle: '',
  hero_logo_url: '',
  about_md: '',
  teachers_intro: '',
  teachers_list: '',
  academy_name: 'Math Academy',
  principal_name: '',
  academy_address: '',
  academy_phone: '',
  academy_email: '',
  founded_year: '',
  academy_description: '',
  header_logo: '',
  favicon: '',
  loading_logo: '',
  primary_color: '#2d4373',
  secondary_color: '#f8faff',
  accent_color: '#226ad6',
  title_font: 'Noto Sans KR',
  body_font: 'system-ui',
  popupBanners: []
};

const SUPER_BOOL_KEYS = [
  'menu_home_on',
  'menu_blog_on',
  'menu_materials_on',
  'menu_contact_on',
  'menu_news_on',
  'menu_teachers_on',
  'blog_show'
];

const SUPER_STRING_KEYS = [
  'site_theme_color',
  'site_theme_mode',
  'default_class_name',
  'hero_title',
  'hero_subtitle',
  'hero_logo_url',
  'about_md',
  'teachers_intro',
  'teachers_list',
  'academy_name',
  'principal_name',
  'academy_address',
  'academy_phone',
  'academy_email',
  'founded_year',
  'academy_description',
  'header_logo',
  'favicon',
  'loading_logo',
  'primary_color',
  'secondary_color',
  'accent_color',
  'title_font',
  'body_font'
];

const SUPER_JSON_KEYS = ['home_sections', 'popupBanners'];

const HOME_SECTION_KEYS = ['hero','about','schedule','teachers','blog'];
const HOME_SECTION_KEY_NORMALIZE = { stats: 'schedule', statistics: 'schedule', features: 'about', testimonials: 'teachers', contact: 'schedule', cta: 'blog' };

function normalizeHomeSections(list = []) {
  const map = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const key = HOME_SECTION_KEY_NORMALIZE[item.key] || item.key;
    if (HOME_SECTION_KEYS.includes(key) && !map.has(key)) {
      map.set(key, !!item.on);
    }
  }
  return HOME_SECTION_KEYS.map((key) => ({ key, on: map.get(key) ?? false }));
}

function parseMaybe(str) {
  if (typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch { return null; }
}

function toBool(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) {
    return typeof fallback === 'boolean' ? fallback : !!fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return typeof fallback === 'boolean' ? fallback : !!fallback;
}

async function readPublicSettings() {
  let doc = await Setting.findOne({ key: 'publicSite' }).lean();
  if (!doc) doc = await Setting.findOne({ name: 'publicSite' }).lean();

  const settings = { ...DEFAULT_PUBLIC };
  if (doc) {
    const fromValue = parseMaybe(doc.value);
    if (fromValue && typeof fromValue === 'object') Object.assign(settings, fromValue);
    else if (doc.data && typeof doc.data === 'object') Object.assign(settings, doc.data);
  }

  const keys = Array.from(new Set([...SUPER_BOOL_KEYS, ...SUPER_STRING_KEYS, ...SUPER_JSON_KEYS]));
  if (keys.length) {
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const map = {};
    for (const row of rows) map[row.key] = row.value;

    for (const key of SUPER_STRING_KEYS) {
      if (Object.prototype.hasOwnProperty.call(map, key)) settings[key] = map[key];
    }
    for (const key of SUPER_BOOL_KEYS) {
      if (Object.prototype.hasOwnProperty.call(map, key)) settings[key] = toBool(map[key], settings[key]);
    }
    for (const key of SUPER_JSON_KEYS) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        const parsed = parseMaybe(map[key]);
        settings[key] = Array.isArray(parsed) ? parsed : settings[key];
      }
    }
  }

  for (const key of SUPER_JSON_KEYS) {
    if (!Array.isArray(settings[key])) {
      const parsed = parseMaybe(settings[key]);
      settings[key] = Array.isArray(parsed) ? parsed : [];
    }
  }

  if (settings.site_theme_mode !== 'dark' && settings.site_theme_mode !== 'light') {
    settings.site_theme_mode = DEFAULT_PUBLIC.site_theme_mode;
  }

  settings.home_sections = normalizeHomeSections(settings.home_sections);

  return settings;
}

async function writePublicSettings(valueObj, updatedBy = 'system') {
  const normalized = normalizeHomeSections(valueObj.home_sections);
  const withSections = { ...valueObj, home_sections: normalized };
  const json = JSON.stringify(withSections);
  await Setting.findOneAndUpdate(
    { key: 'publicSite' },
    { key: 'publicSite', value: json, data: withSections, updatedBy, updatedAt: new Date() },
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
    const nextRaw = { ...cur, ...(req.body || {}) };
    const next = { ...nextRaw, home_sections: normalizeHomeSections(nextRaw.home_sections) };
    await writePublicSettings(next, req.user?._id || 'admin');
    res.json(next);
  } catch (e) {
    res.status(400).json({ message: 'failed to save public settings' });
  }
};
