// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

const BOOL_KEYS = ['menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on'];
const ALL_KEYS = [
  ...BOOL_KEYS,
  'site_theme_color',
  'site_theme_mode',     // 'light' | 'dark'
  'default_class_name',
  'home_sections',       // JSON string
];

const defaults = {
  menu_home_on: true,
  menu_blog_on: true,
  menu_materials_on: true,
  menu_contact_on: true,
  site_theme_color: '#2d4373',
  site_theme_mode: 'light',
  default_class_name: 'IG수학',
  home_sections: [],
};

function asBool(v, def = true) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v ?? '');
  if (s === 'true') return true;
  if (s === 'false') return false;
  return def;
}

exports.getPublic = async (_req, res) => {
  try {
    const rows = await Setting.find({ key: { $in: ALL_KEYS } }).lean();
    const map = {};
    for (const k of ALL_KEYS) map[k] = null;
    for (const r of rows) map[r.key] = r.value;

    const out = {
      menu_home_on: asBool(map.menu_home_on, defaults.menu_home_on),
      menu_blog_on: asBool(map.menu_blog_on, defaults.menu_blog_on),
      menu_materials_on: asBool(map.menu_materials_on, defaults.menu_materials_on),
      menu_contact_on: asBool(map.menu_contact_on, defaults.menu_contact_on),
      site_theme_color: map.site_theme_color || defaults.site_theme_color,
      site_theme_mode: (map.site_theme_mode === 'dark') ? 'dark' : defaults.site_theme_mode,
      default_class_name: map.default_class_name || defaults.default_class_name,
      home_sections: [],
    };

    try {
      out.home_sections = map.home_sections ? JSON.parse(map.home_sections) : defaults.home_sections;
      if (!Array.isArray(out.home_sections)) out.home_sections = defaults.home_sections;
    } catch {
      out.home_sections = defaults.home_sections;
    }

    res.json({ ok: true, settings: out });
  } catch (e) {
    res.status(500).json({ ok: false, message: '공개 설정 조회 실패', error: String(e?.message || e) });
  }
};
