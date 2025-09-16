// server/controllers/superSettingsController.js
const Setting = require('../models/Setting');

/** 내부 유틸: get/set */
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

/** GET /api/admin/super/site-settings
 *  - 전역 메뉴 토글/테마/기본반명 등 반환
 */
exports.getSiteSettings = async (_req, res) => {
  try {
    const keys = [
      'menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on',
      'site_theme_color', 'site_theme_mode', // light | dark
      'home_sections',       // JSON string [{"key":"hero","on":true},...]
      'default_class_name'   // 기본 반명
    ];
    const obj = {};
    for (const k of keys) obj[k] = await getSetting(k, '');
    // JSON 파싱 필드
    try { obj.home_sections = obj.home_sections ? JSON.parse(obj.home_sections) : []; } catch { obj.home_sections = []; }
    res.json({ ok: true, settings: obj });
  } catch (e) {
    res.status(500).json({ ok: false, message: '설정 조회 실패', error: String(e?.message || e) });
  }
};

/** POST /api/admin/super/site-settings
 *  body: {
 *    menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on,
 *    site_theme_color, site_theme_mode,
 *    home_sections: [{key,on}], default_class_name
 *  }
 */
exports.saveSiteSettings = async (req, res) => {
  try {
    const {
      menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on,
      site_theme_color, site_theme_mode,
      home_sections, default_class_name
    } = req.body || {};

    const toStrBool = v => (v === true || v === 'true') ? 'true' : 'false';

    await setSetting('menu_home_on',        toStrBool(menu_home_on));
    await setSetting('menu_blog_on',        toStrBool(menu_blog_on));
    await setSetting('menu_materials_on',   toStrBool(menu_materials_on));
    await setSetting('menu_contact_on',     toStrBool(menu_contact_on));
    await setSetting('site_theme_color',    site_theme_color || '#2d4373');
    await setSetting('site_theme_mode',     (site_theme_mode === 'dark') ? 'dark' : 'light');
    await setSetting('default_class_name',  default_class_name || 'IG수학');
    await setSetting('home_sections',       Array.isArray(home_sections) ? home_sections : []);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: '설정 저장 실패', error: String(e?.message || e) });
  }
};
