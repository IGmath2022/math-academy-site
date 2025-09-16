// server/controllers/superSettingsController.js
const Setting = require('../models/Setting');

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
const toStrBool = v => (v === true || v === 'true' || v === 1 || v === '1') ? 'true' : 'false';

/** GET /api/admin/super/site-settings (슈퍼)
 *  - 관리 UI에서 편집할 전역 키 전부 반환
 */
exports.getSiteSettings = async (_req, res) => {
  try {
    const keys = [
      // 메뉴/테마
      'menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on',
      'site_theme_color', 'site_theme_mode',
      // 홈 섹션 & 콘텐츠
      'home_sections',
      'hero_title', 'hero_subtitle', 'hero_logo_url',
      'about_md',
      // 기타
      'default_class_name',
      'blog_show',
    ];
    const obj = {};
    for (const k of keys) obj[k] = await getSetting(k, '');

    try { obj.home_sections = obj.home_sections ? JSON.parse(obj.home_sections) : []; } catch { obj.home_sections = []; }

    res.json({ ok: true, settings: obj });
  } catch (e) {
    console.error('[superSettingsController.getSiteSettings]', e);
    res.status(500).json({ ok: false, message: '설정 조회 실패', error: String(e?.message || e) });
  }
};

/** POST /api/admin/super/site-settings (슈퍼)
 * body: {
 *  menu_*_on(bool), site_theme_color, site_theme_mode('light'|'dark'),
 *  home_sections: [{key,on}],
 *  hero_title, hero_subtitle, hero_logo_url, about_md,
 *  default_class_name, blog_show
 * }
 */
exports.saveSiteSettings = async (req, res) => {
  try {
    const {
      menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on,
      site_theme_color, site_theme_mode,
      home_sections,
      hero_title, hero_subtitle, hero_logo_url,
      about_md,
      default_class_name,
      blog_show,
    } = req.body || {};

    await setSetting('menu_home_on',       toStrBool(menu_home_on));
    await setSetting('menu_blog_on',       toStrBool(menu_blog_on));
    await setSetting('menu_materials_on',  toStrBool(menu_materials_on));
    await setSetting('menu_contact_on',    toStrBool(menu_contact_on));

    await setSetting('site_theme_color',   site_theme_color || '#2d4373');
    await setSetting('site_theme_mode',    (site_theme_mode === 'dark') ? 'dark' : 'light');

    await setSetting('home_sections',      Array.isArray(home_sections) ? home_sections : []);

    await setSetting('hero_title',         String(hero_title ?? ''));
    await setSetting('hero_subtitle',      String(hero_subtitle ?? ''));
    await setSetting('hero_logo_url',      String(hero_logo_url ?? ''));
    await setSetting('about_md',           String(about_md ?? ''));

    await setSetting('default_class_name', String(default_class_name ?? 'IG수학'));

    await setSetting('blog_show',          toStrBool(blog_show));

    res.json({ ok: true });
  } catch (e) {
    console.error('[superSettingsController.saveSiteSettings]', e);
    res.status(500).json({ ok: false, message: '설정 저장 실패', error: String(e?.message || e) });
  }
};
