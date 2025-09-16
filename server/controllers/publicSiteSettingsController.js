// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

async function getSetting(key, def = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? def;
}

exports.getPublic = async (_req, res) => {
  try {
    const keys = [
      'menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on',
      'site_theme_color', 'site_theme_mode',
      'home_sections',
      'default_class_name',
      'hero_title', 'hero_subtitle', 'hero_logo_url',
      'about_md', 'blog_show',
    ];
    const raw = {};
    for (const k of keys) raw[k] = await getSetting(k, '');

    // 가공
    const toBool = v => {
      if (typeof v === 'boolean') return v;
      return String(v) === 'true';
    };

    let home_sections = [];
    try { home_sections = raw.home_sections ? JSON.parse(raw.home_sections) : []; } catch {}

    const out = {
      // 메뉴
      menu: {
        home: raw.menu_home_on === '' ? true : toBool(raw.menu_home_on),
        blog: toBool(raw.menu_blog_on),
        materials: toBool(raw.menu_materials_on),
        contact: toBool(raw.menu_contact_on),
      },
      // 테마
      theme: {
        color: raw.site_theme_color || '#2d4373',
        mode: raw.site_theme_mode === 'dark' ? 'dark' : 'light',
      },
      // 섹션/반/소개
      home_sections,
      default_class_name: raw.default_class_name || 'IG수학',
      hero: {
        title: raw.hero_title || '',
        subtitle: raw.hero_subtitle || '',
        logoUrl: raw.hero_logo_url || '',
      },
      about_md: raw.about_md || '',
      blog_show: toBool(raw.blog_show),
    };

    res.json({ ok: true, settings: out });
  } catch (e) {
    res.status(500).json({ ok: false, message: '공개 설정 조회 실패', error: String(e?.message || e) });
  }
};
