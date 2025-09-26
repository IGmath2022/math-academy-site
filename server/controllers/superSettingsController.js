const Setting = require('../models/Setting');

const SETTINGS_KEYS = [
  'menu_home_on', 'menu_blog_on', 'menu_materials_on', 'menu_contact_on', 'menu_news_on', 'menu_teachers_on',
  'site_theme_color', 'site_theme_mode',
  'home_sections',
  'hero_title', 'hero_subtitle', 'hero_logo_url',
  'about_md',
  'teachers_intro', 'teachers_list',
  'default_class_name',
  'blog_show',
  'academy_name', 'principal_name', 'academy_address', 'academy_phone', 'academy_email',
  'founded_year', 'academy_description',
  'header_logo', 'favicon', 'loading_logo',
  'primary_color', 'secondary_color', 'accent_color',
  'title_font', 'body_font',
  'popupBanners',
];

const HOME_SECTION_KEYS = ['hero', 'about', 'schedule', 'teachers', 'blog'];
const HOME_SECTION_KEY_NORMALIZE = {
  stats: 'schedule',
  statistics: 'schedule',
  features: 'about',
  testimonials: 'teachers',
  contact: 'schedule',
  cta: 'blog',
};

const DEFAULT_SCHOOL_NAME = '수학 전문 학원';
const DEFAULT_THEME_COLOR = '#2d4373';
const DEFAULT_SECONDARY = '#f8faff';
const DEFAULT_ACCENT = '#226ad6';
const DEFAULT_TITLE_FONT = 'Noto Sans KR';
const DEFAULT_BODY_FONT = 'system-ui';

const toStrBool = (value) => (value === true || value === 'true' || value === 1 || value === '1') ? 'true' : 'false';

function sanitizeText(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const str = String(value);
  const trimmed = str.trim();
  return trimmed || fallback;
}

function sanitizeColor(value, fallback) {
  const text = sanitizeText(value, fallback);
  return text || fallback;
}

function parseJSON(value, fallback) {
  if (!value || typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function normalizeHomeSections(list = []) {
  const map = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    if (!item) continue;
    const normalizedKey = HOME_SECTION_KEY_NORMALIZE[item.key] || item.key;
    if (HOME_SECTION_KEYS.includes(normalizedKey) && !map.has(normalizedKey)) {
      map.set(normalizedKey, !!item.on);
    }
  }
  return HOME_SECTION_KEYS.map((key) => ({ key, on: map.get(key) ?? false }));
}

exports.getSiteSettings = async (_req, res) => {
  try {
    const docs = await Setting.find({ key: { $in: SETTINGS_KEYS } }).lean();
    const valueMap = new Map();
    for (const doc of docs) {
      valueMap.set(doc.key, doc.value);
    }

    const result = {};
    for (const key of SETTINGS_KEYS) {
      result[key] = valueMap.has(key) ? valueMap.get(key) : '';
    }

    result.home_sections = parseJSON(result.home_sections, []);
    result.popupBanners = parseJSON(result.popupBanners, []);

    return res.json({ ok: true, settings: result });
  } catch (e) {
    console.error('[superSettingsController.getSiteSettings]', e);
    return res.status(500).json({ ok: false, message: '���� ��ȸ�� �����߽��ϴ�.', error: String(e?.message || e) });
  }
};

exports.saveSiteSettings = async (req, res) => {
  try {
    const {
      menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on, menu_news_on, menu_teachers_on,
      site_theme_color, site_theme_mode,
      home_sections,
      hero_title, hero_subtitle, hero_logo_url,
      about_md,
      teachers_intro, teachers_list,
      default_class_name,
      blog_show,
      academy_name, principal_name, academy_address, academy_phone, academy_email,
      founded_year, academy_description,
      header_logo, favicon, loading_logo,
      primary_color, secondary_color, accent_color,
      title_font, body_font,
    } = req.body || {};

    const normalizedSections = normalizeHomeSections(home_sections);

    const updates = [];
    const response = {};

    const addBool = (key, value) => {
      const stored = toStrBool(value);
      updates.push({ key, value: stored });
      response[key] = stored;
    };

    const addString = (key, value, fallback = '') => {
      const stored = sanitizeText(value, fallback);
      updates.push({ key, value: stored });
      response[key] = stored;
    };

    const addColor = (key, value, fallback) => {
      const stored = sanitizeColor(value, fallback);
      updates.push({ key, value: stored });
      response[key] = stored;
    };

    const addJSON = (key, value) => {
      updates.push({ key, value: JSON.stringify(value) });
      response[key] = value;
    };

    addBool('menu_home_on', menu_home_on);
    addBool('menu_blog_on', menu_blog_on);
    addBool('menu_materials_on', menu_materials_on);
    addBool('menu_contact_on', menu_contact_on);
    addBool('menu_news_on', menu_news_on);
    addBool('menu_teachers_on', menu_teachers_on);

    addColor('site_theme_color', site_theme_color, DEFAULT_THEME_COLOR);
    const themeMode = sanitizeText(site_theme_mode === 'dark' ? 'dark' : 'light', 'light');
    addString('site_theme_mode', themeMode, 'light');

    addJSON('home_sections', normalizedSections);

    addString('hero_title', hero_title);
    addString('hero_subtitle', hero_subtitle);
    addString('hero_logo_url', hero_logo_url);
    addString('about_md', about_md);

    addString('teachers_intro', teachers_intro);
    addString('teachers_list', teachers_list);

    addString('default_class_name', default_class_name, 'IG����');
    addBool('blog_show', blog_show);

    addString('academy_name', academy_name, DEFAULT_SCHOOL_NAME);
    addString('principal_name', principal_name);
    addString('academy_address', academy_address);
    addString('academy_phone', academy_phone);
    addString('academy_email', academy_email);
    addString('founded_year', founded_year);
    addString('academy_description', academy_description);

    addString('header_logo', header_logo);
    addString('favicon', favicon);
    addString('loading_logo', loading_logo);

    addColor('primary_color', primary_color, DEFAULT_THEME_COLOR);
    addColor('secondary_color', secondary_color, DEFAULT_SECONDARY);
    addColor('accent_color', accent_color, DEFAULT_ACCENT);

    addString('title_font', title_font, DEFAULT_TITLE_FONT);
    addString('body_font', body_font, DEFAULT_BODY_FONT);

    if (updates.length) {
      const bulkOps = updates.map(({ key, value }) => ({
        updateOne: {
          filter: { key },
          update: { $set: { key, value } },
          upsert: true,
        },
      }));
      await Setting.bulkWrite(bulkOps, { ordered: false });
    }

    const popupDoc = await Setting.findOne({ key: 'popupBanners' }).lean();
    const popupBanners = parseJSON(popupDoc?.value, []);
    response.popupBanners = popupBanners;

    const publicSiteData = {
      teachers_intro: response.teachers_intro,
      teachers_list: response.teachers_list,
      hero_title: response.hero_title,
      hero_subtitle: response.hero_subtitle,
      hero_logo_url: response.hero_logo_url,
      about_md: response.about_md,
      site_theme_color: response.site_theme_color || DEFAULT_THEME_COLOR,
      site_theme_mode: themeMode,
      primary_color: response.primary_color || DEFAULT_THEME_COLOR,
      secondary_color: response.secondary_color || DEFAULT_SECONDARY,
      accent_color: response.accent_color || DEFAULT_ACCENT,
      menu_home_on: response.menu_home_on,
      menu_blog_on: response.menu_blog_on,
      menu_materials_on: response.menu_materials_on,
      menu_contact_on: response.menu_contact_on,
      menu_news_on: response.menu_news_on,
      blog_show: response.blog_show,
      home_sections: normalizedSections,
      academy_name: response.academy_name || DEFAULT_SCHOOL_NAME,
      principal_name: response.principal_name,
      academy_address: response.academy_address,
      academy_phone: response.academy_phone,
      academy_email: response.academy_email,
      founded_year: response.founded_year,
      academy_description: response.academy_description,
      title_font: response.title_font || DEFAULT_TITLE_FONT,
      body_font: response.body_font || DEFAULT_BODY_FONT,
      popupBanners,
    };

    await Setting.findOneAndUpdate(
      { key: 'publicSite' },
      {
        key: 'publicSite',
        value: JSON.stringify(publicSiteData),
        data: publicSiteData,
        updatedBy: req.user?._id || 'super',
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, settings: response });
  } catch (e) {
    console.error('[superSettingsController.saveSiteSettings]', e);
    return res.status(500).json({ ok: false, message: '설정 저장에 실패했습니다.', error: String(e?.message || e) });
  }
};

