// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

/* -------- helpers -------- */
async function getStr(key, def = "") {
  const s = await Setting.findOne({ key });
  return s?.value ?? def;
}
async function getBool(key, def = true) {
  const v = await getStr(key, def ? "true" : "false");
  if (typeof v === "string") return v === "true";
  return !!v;
}
async function getJSON(key, def = []) {
  const v = await getStr(key, "");
  if (!v) return def;
  try { return JSON.parse(v); } catch { return def; }
}

/**
 * GET /api/site/public-settings
 * 응답 형태:
 * { ok: true, settings: {
 *    menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on,   // boolean
 *    site_theme_color, site_theme_mode,                                 // string
 *    default_class_name,                                                // string
 *    home_sections                                                      // array[{key,on}]
 * } }
 */
exports.getPublic = async (_req, res) => {
  try {
    const settings = {
      menu_home_on:       await getBool('menu_home_on', true),
      menu_blog_on:       await getBool('menu_blog_on', true),
      menu_materials_on:  await getBool('menu_materials_on', true),
      menu_contact_on:    await getBool('menu_contact_on', true),

      site_theme_color:   await getStr('site_theme_color', '#2d4373'),
      site_theme_mode:    (await getStr('site_theme_mode', 'light')) === 'dark' ? 'dark' : 'light',

      default_class_name: await getStr('default_class_name', 'IG수학'),
      home_sections:      await getJSON('home_sections', [])
    };
    // 홈 섹션 안전 보정: key 누락/오류 제거 + on 값 boolean화
    settings.home_sections = Array.isArray(settings.home_sections)
      ? settings.home_sections
          .filter(s => s && typeof s.key === 'string')
          .map(s => ({ key: s.key, on: s.on !== false }))
      : [];

    res.json({ ok: true, settings });
  } catch (e) {
    res.status(500).json({ ok: false, message: '공개 설정 조회 실패', error: String(e?.message || e) });
  }
};
