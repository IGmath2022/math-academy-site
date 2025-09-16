// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

function asBool(v, def = false) {
  if (v === undefined || v === null) return def;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1';
}

async function getSetting(key, def = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? def;
}

exports.getPublic = async (_req, res) => {
  try {
    // 서버 DB에는 문자열로 저장돼 있어도 프런트로는 "일관된 타입"으로 내려줍니다.
    const menu_home_on       = asBool(await getSetting('menu_home_on'), true);
    const menu_blog_on       = asBool(await getSetting('menu_blog_on'), true);
    const menu_materials_on  = asBool(await getSetting('menu_materials_on'), true);
    const menu_contact_on    = asBool(await getSetting('menu_contact_on'), true);

    const site_theme_color   = (await getSetting('site_theme_color', '#2d4373')) || '#2d4373';
    const site_theme_mode    = (await getSetting('site_theme_mode', 'light')) === 'dark' ? 'dark' : 'light';
    const default_class_name = (await getSetting('default_class_name', 'IG수학')) || 'IG수학';

    // 섹션은 표준 키만 유지
    const STD_SECS = ['hero', 'features', 'stats', 'cta'];
    let home_sections_raw = await getSetting('home_sections', '[]');
    try { home_sections_raw = JSON.parse(home_sections_raw); } catch { home_sections_raw = []; }
    const allow = new Set(STD_SECS);
    const map = new Map(
      (Array.isArray(home_sections_raw) ? home_sections_raw : [])
        .filter(x => x && allow.has(x.key))
        .map(x => [x.key, !!x.on])
    );
    const home_sections = STD_SECS.map(k => ({ key: k, on: map.has(k) ? map.get(k) : true }));

    res.json({
      ok: true,
      settings: {
        menu_home_on,
        menu_blog_on,
        menu_materials_on,
        menu_contact_on,
        site_theme_color,
        site_theme_mode,
        default_class_name,
        home_sections,
        _ts: Date.now(), // 프런트 캐시용
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: '공개 설정 조회 실패', error: String(e?.message || e) });
  }
};
