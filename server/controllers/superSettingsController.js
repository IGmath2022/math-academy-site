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

/** GET /api/super/site-settings (슈퍼)
 *  - 공개 사이트 설정 관련 데이터 반환
 */
exports.getSiteSettings = async (_req, res) => {
  try {
    const keys = [
      // 메뉴/테마
      'menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on', 'menu_news_on',
      'site_theme_color', 'site_theme_mode',
      // 홈섹션 & 콘텐츠
      'home_sections',
      'hero_title', 'hero_subtitle', 'hero_logo_url',
      'about_md',
      // 강사진
      'teachers_intro', 'teachers_list',
      // 기타
      'default_class_name',
      'blog_show',
      // 브랜딩 설정
      'academy_name', 'principal_name', 'academy_address', 'academy_phone', 'academy_email',
      'founded_year', 'academy_description',
      'header_logo', 'favicon', 'loading_logo',
      'primary_color', 'secondary_color', 'accent_color',
      'title_font', 'body_font',
      // 팝업 배너
      'popupBanners',
    ];
    const obj = {};
    for (const k of keys) obj[k] = await getSetting(k, '');

    try { obj.home_sections = obj.home_sections ? JSON.parse(obj.home_sections) : []; } catch { obj.home_sections = []; }
    try { obj.popupBanners = obj.popupBanners ? JSON.parse(obj.popupBanners) : []; } catch { obj.popupBanners = []; }

    res.json(obj);
  } catch (e) {
    console.error('[superSettingsController.getSiteSettings]', e);
    res.status(500).json({ ok: false, message: '설정 조회 실패', error: String(e?.message || e) });
  }
};

/** POST /api/super/site-settings (슈퍼)
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
      menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on, menu_news_on,
      site_theme_color, site_theme_mode,
      home_sections,
      hero_title, hero_subtitle, hero_logo_url,
      about_md,
      teachers_intro, teachers_list,
      default_class_name,
      blog_show,
      // 브랜딩 설정
      academy_name, principal_name, academy_address, academy_phone, academy_email,
      founded_year, academy_description,
      header_logo, favicon, loading_logo,
      primary_color, secondary_color, accent_color,
      title_font, body_font,
      // 팝업 배너
      popupBanners,
    } = req.body || {};

    await setSetting('menu_home_on',       toStrBool(menu_home_on));
    await setSetting('menu_blog_on',       toStrBool(menu_blog_on));
    await setSetting('menu_materials_on',  toStrBool(menu_materials_on));
    await setSetting('menu_contact_on',    toStrBool(menu_contact_on));
    await setSetting('menu_news_on',      toStrBool(menu_news_on));

    await setSetting('site_theme_color',   site_theme_color || '#2d4373');
    await setSetting('site_theme_mode',    (site_theme_mode === 'dark') ? 'dark' : 'light');

    await setSetting('home_sections',      Array.isArray(home_sections) ? home_sections : []);

    await setSetting('popupBanners',       Array.isArray(popupBanners) ? popupBanners : []);

    await setSetting('hero_title',         String(hero_title ?? ''));
    await setSetting('hero_subtitle',      String(hero_subtitle ?? ''));
    await setSetting('hero_logo_url',      String(hero_logo_url ?? ''));
    await setSetting('about_md',           String(about_md ?? ''));

    await setSetting('teachers_intro',     String(teachers_intro ?? ''));
    await setSetting('teachers_list',      String(teachers_list ?? ''));

    await setSetting('default_class_name', String(default_class_name ?? 'IG수학'));

    await setSetting('blog_show',          toStrBool(blog_show));

    // 브랜딩 설정 저장
    await setSetting('academy_name',       String(academy_name ?? '수학 전문 학원'));
    await setSetting('principal_name',     String(principal_name ?? ''));
    await setSetting('academy_address',    String(academy_address ?? ''));
    await setSetting('academy_phone',      String(academy_phone ?? ''));
    await setSetting('academy_email',      String(academy_email ?? ''));
    await setSetting('founded_year',       String(founded_year ?? ''));
    await setSetting('academy_description', String(academy_description ?? ''));
    await setSetting('header_logo',        String(header_logo ?? ''));
    await setSetting('favicon',            String(favicon ?? ''));
    await setSetting('loading_logo',       String(loading_logo ?? ''));
    await setSetting('primary_color',      String(primary_color ?? '#2d4373'));
    await setSetting('secondary_color',    String(secondary_color ?? '#f8faff'));
    await setSetting('accent_color',       String(accent_color ?? '#226ad6'));
    await setSetting('title_font',         String(title_font ?? 'Noto Sans KR'));
    await setSetting('body_font',          String(body_font ?? 'system-ui'));

    // public settings도 업데이트
    const Setting = require('../models/Setting');
    try {
      const publicSiteData = {
        teachers_intro: String(teachers_intro ?? ''),
        teachers_list: String(teachers_list ?? ''),
        hero_title: String(hero_title ?? ''),
        hero_subtitle: String(hero_subtitle ?? ''),
        hero_logo_url: String(hero_logo_url ?? ''),
        about_md: String(about_md ?? ''),
        site_theme_color: site_theme_color || '#2d4373',
        site_theme_mode: (site_theme_mode === 'dark') ? 'dark' : 'light',
        primary_color: String(primary_color ?? '#2d4373'),
        secondary_color: String(secondary_color ?? '#f8faff'),
        accent_color: String(accent_color ?? '#226ad6'),
        menu_home_on: toStrBool(menu_home_on),
        menu_blog_on: toStrBool(menu_blog_on),
        menu_materials_on: toStrBool(menu_materials_on),
        menu_contact_on: toStrBool(menu_contact_on),
        menu_news_on: toStrBool(menu_news_on),
        blog_show: toStrBool(blog_show),
        home_sections: Array.isArray(home_sections) ? home_sections : [],
        academy_name: String(academy_name ?? '수학 전문 학원'),
        principal_name: String(principal_name ?? ''),
        academy_address: String(academy_address ?? ''),
        academy_phone: String(academy_phone ?? ''),
        academy_email: String(academy_email ?? ''),
        founded_year: String(founded_year ?? ''),
        academy_description: String(academy_description ?? ''),
        title_font: String(title_font ?? 'Noto Sans KR'),
        body_font: String(body_font ?? 'system-ui'),
        popupBanners: Array.isArray(popupBanners) ? popupBanners : [],
      };

      await Setting.findOneAndUpdate(
        { key: 'publicSite' },
        { key: 'publicSite', value: JSON.stringify(publicSiteData), data: publicSiteData, updatedBy: 'super', updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log('✅ Public site settings updated with teachers data');
    } catch (pubErr) {
      console.error('⚠️ Failed to update public settings:', pubErr);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[superSettingsController.saveSiteSettings]', e);
    res.status(500).json({ ok: false, message: '설정 저장 실패', error: String(e?.message || e) });
  }
};