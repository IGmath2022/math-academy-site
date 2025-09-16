// server/controllers/superSettingsController.js
const Setting = require('../models/Setting');

/** 내부 유틸 */
async function getSetting(key, def = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? def;
}
async function setSetting(key, value) {
  const v = (typeof value === 'string') ? value : JSON.stringify(value);
  await Setting.findOneAndUpdate(
    { key },
    { $set: { value: v } },
    { upsert: true, new: true }
  );
}

/** GET /api/admin/super/site-settings */
exports.getSiteSettings = async (_req, res) => {
  try {
    const keys = [
      // 메뉴/테마/반/섹션
      'menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on',
      'site_theme_color', 'site_theme_mode',
      'home_sections',
      'default_class_name',
      // 히어로/소개/블로그 노출
      'hero_title', 'hero_subtitle', 'hero_logo_url',
      'about_md', 'blog_show',
    ];
    const obj = {};
    for (const k of keys) obj[k] = await getSetting(k, '');
    // JSON 파싱
    try { obj.home_sections = obj.home_sections ? JSON.parse(obj.home_sections) : []; } catch { obj.home_sections = []; }
    res.json({ ok: true, settings: obj });
  } catch (e) {
    res.status(500).json({ ok: false, message: '설정 조회 실패', error: String(e?.message || e) });
  }
};

/** POST /api/admin/super/site-settings */
exports.saveSiteSettings = async (req, res) => {
  try {
    const {
      menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on,
      site_theme_color, site_theme_mode,
      home_sections, default_class_name,
      hero_title, hero_subtitle, hero_logo_url,
      about_md, blog_show,
    } = req.body || {};

    const toStrBool = v => (v === true || v === 'true') ? 'true' : 'false';

    await setSetting('menu_home_on',       toStrBool(menu_home_on));
    await setSetting('menu_blog_on',       toStrBool(menu_blog_on));
    await setSetting('menu_materials_on',  toStrBool(menu_materials_on));
    await setSetting('menu_contact_on',    toStrBool(menu_contact_on));

    await setSetting('site_theme_color',   site_theme_color || '#2d4373');
    await setSetting('site_theme_mode',    (site_theme_mode === 'dark') ? 'dark' : 'light');

    await setSetting('default_class_name', default_class_name || 'IG수학');

    await setSetting('home_sections',      Array.isArray(home_sections) ? home_sections : []);

    await setSetting('hero_title',         hero_title || '');
    await setSetting('hero_subtitle',      hero_subtitle || '');
    await setSetting('hero_logo_url',      hero_logo_url || '');
    await setSetting('about_md',           typeof about_md === 'string' ? about_md : '');
    await setSetting('blog_show',          toStrBool(blog_show));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: '설정 저장 실패', error: String(e?.message || e) });
  }
};
