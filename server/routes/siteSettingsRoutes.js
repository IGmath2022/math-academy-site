// server/routes/siteSettingsRoutes.js
const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const { isAuthenticated } = require('../middleware/auth');

// 슈퍼 권한 체크
function onlySuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role !== 'super') {
    return res.status(403).json({ message: 'Super admin only' });
  }
  next();
}

// 관리자 이상 권한 체크
function onlyAdminOrSuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admins or super users only' });
  }
  next();
}

// GET /api/site/settings - 사이트 설정 조회 (공개)
router.get('/', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      // 기본 설정 생성
      settings = new SiteSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error('[사이트 설정 조회 에러]', err);
    res.status(500).json({ message: '사이트 설정 조회 실패', error: String(err) });
  }
});

// PUT /api/site/settings/branding - 브랜딩 설정 (슈퍼만)
router.put('/branding', isAuthenticated, onlySuper, async (req, res) => {
  try {
    const {
      academyName, principalName, address, phone, email, foundedYear, description,
      headerLogo, favicon, loadingLogo,
      primaryColor, secondaryColor, accentColor,
      titleFont, bodyFont
    } = req.body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }

    // 브랜딩 정보 업데이트
    if (academyName !== undefined) settings.branding.academyName = academyName;
    if (principalName !== undefined) settings.branding.principalName = principalName;
    if (address !== undefined) settings.branding.address = address;
    if (phone !== undefined) settings.branding.phone = phone;
    if (email !== undefined) settings.branding.email = email;
    if (foundedYear !== undefined) settings.branding.foundedYear = foundedYear;
    if (description !== undefined) settings.branding.description = description;

    // 로고 업데이트
    if (headerLogo !== undefined) settings.branding.headerLogo = headerLogo;
    if (favicon !== undefined) settings.branding.favicon = favicon;
    if (loadingLogo !== undefined) settings.branding.loadingLogo = loadingLogo;

    // 컬러 테마 업데이트
    if (primaryColor !== undefined) settings.branding.primaryColor = primaryColor;
    if (secondaryColor !== undefined) settings.branding.secondaryColor = secondaryColor;
    if (accentColor !== undefined) settings.branding.accentColor = accentColor;

    // 폰트 업데이트
    if (titleFont !== undefined) settings.branding.titleFont = titleFont;
    if (bodyFont !== undefined) settings.branding.bodyFont = bodyFont;

    await settings.save();
    res.json({ success: true, branding: settings.branding });
  } catch (err) {
    console.error('[브랜딩 설정 저장 에러]', err);
    res.status(500).json({ message: '브랜딩 설정 저장 실패', error: String(err) });
  }
});

// PUT /api/site/settings/layout - 레이아웃 설정 (슈퍼만)
router.put('/layout', isAuthenticated, onlySuper, async (req, res) => {
  try {
    const { mainSections, navigation, sidebar, footer } = req.body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }

    // 레이아웃 정보 업데이트
    if (mainSections !== undefined) settings.layout.mainSections = mainSections;
    if (navigation !== undefined) settings.layout.navigation = navigation;
    if (sidebar !== undefined) settings.layout.sidebar = { ...settings.layout.sidebar, ...sidebar };
    if (footer !== undefined) settings.layout.footer = { ...settings.layout.footer, ...footer };

    await settings.save();
    res.json({ success: true, layout: settings.layout });
  } catch (err) {
    console.error('[레이아웃 설정 저장 에러]', err);
    res.status(500).json({ message: '레이아웃 설정 저장 실패', error: String(err) });
  }
});

// PUT /api/site/settings/banners - 팝업 배너 설정 (관리자 이상)
router.put('/settings/banners', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { popupBanners } = req.body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }

    if (popupBanners !== undefined) settings.popupBanners = popupBanners;

    await settings.save();
    res.json({ success: true, popupBanners: settings.popupBanners });
  } catch (err) {
    console.error('[배너 설정 저장 에러]', err);
    res.status(500).json({ message: '배너 설정 저장 실패', error: String(err) });
  }
});

// GET /api/site/settings/public - 공개 설정 조회 (브랜딩 + 레이아웃만)
router.get('/settings/public', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne().select('branding layout');
    if (!settings) {
      return res.json({
        branding: {},
        layout: {
          navigation: [
            { title: '학원소개', url: '/about', order: 1, visible: true },
            { title: '강의안내', url: '/courses', order: 2, visible: true },
            { title: '공지사항', url: '/notice', order: 3, visible: true },
            { title: '상담신청', url: '/contact', order: 4, visible: true }
          ]
        }
      });
    }
    res.json({ branding: settings.branding, layout: settings.layout });
  } catch (err) {
    console.error('[공개 설정 조회 에러]', err);
    res.status(500).json({ message: '공개 설정 조회 실패', error: String(err) });
  }
});

module.exports = router;