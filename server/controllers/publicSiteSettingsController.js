// server/controllers/publicSiteSettingsController.js
const Setting = require('../models/Setting');

async function getSetting(key, def = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? def;
}

function toBool(v, def = false) {
  if (v === undefined || v === null || v === '') return def;
  return (v === true || v === 'true' || v === '1');
}

/** GET /api/site/public-settings (비로그인 공개)
 *  - NavBar/Main에서 사용할 최소 설정을 한번에 제공
 */
exports.getPublic = async (_req, res) => {
  try {
    // 메뉴/테마
    const menu_home_on       = toBool(await getSetting('menu_home_on',       'true'),  true);
    const menu_blog_on       = toBool(await getSetting('menu_blog_on',       'true'),  true);
    const menu_materials_on  = toBool(await getSetting('menu_materials_on',  'true'),  true);
    const menu_contact_on    = toBool(await getSetting('menu_contact_on',    'true'),  true);
    const site_theme_color   = await getSetting('site_theme_color', '#2d4373');
    const site_theme_mode    = await getSetting('site_theme_mode',  'light');

    // 홈 섹션 배열(없으면 기본 세트)
    let home_sections_raw = await getSetting('home_sections', '');
    let home_sections = [];
    try { home_sections = home_sections_raw ? JSON.parse(home_sections_raw) : []; } catch { home_sections = []; }
    if (!Array.isArray(home_sections) || home_sections.length === 0) {
      home_sections = [
        { key: 'hero', on: true },
        { key: 'about', on: true },
        { key: 'teachers', on: true },
        { key: 'schedule', on: true },
        { key: 'blog', on: true },
      ];
    }

    // 홈 히어로/소개 콘텐츠(슈퍼가 편집)
    const hero_title      = await getSetting('hero_title',     'IG수학학원');
    const hero_subtitle   = await getSetting('hero_subtitle',  '학생의 꿈과 성장을 함께하는 개별맞춤 수학 전문 학원');
    const hero_logo_url   = await getSetting('hero_logo_url',  ''); // 비워도 동작
    const about_md        = await getSetting('about_md',       'IG수학학원은 학생 한 명, 한 명의 실력과 진로에 맞춘 맞춤형 커리큘럼으로 수학 실력은 물론 자기주도 학습 역량까지 함께 키워나갑니다.');

    // 과거 호환: 블로그 노출 키
    const blog_show       = toBool(await getSetting('blog_show', 'true'), true);

    res.json({
      ok: true,
      menu: {
        home: menu_home_on,
        blog: menu_blog_on,
        materials: menu_materials_on,
        contact: menu_contact_on,
      },
      theme: {
        color: site_theme_color,
        mode: site_theme_mode,
      },
      home: {
        sections: home_sections,  // [{key:'hero'|'about'|'teachers'|'schedule'|'blog', on:true|false}]
        hero: { title: hero_title, subtitle: hero_subtitle, logoUrl: hero_logo_url },
        about: { md: about_md },
        blog_show, // 구버전 호환
      },
    });
  } catch (e) {
    console.error('[publicSiteSettingsController.getPublic]', e);
    res.status(500).json({ ok: false, message: '공개 설정 조회 실패', error: String(e?.message || e) });
  }
};
