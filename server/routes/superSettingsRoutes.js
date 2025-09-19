// server/routes/superSettingsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/superSettingsController');
const { requireAdminOrSuper, requireSuper } = require('../middleware/auth');

/**
 * 사이트(공개/운영) 설정 저장/조회 엔드포인트
 * - 운영 측(배너 텍스트/표시여부 포함) 저장은 admin도 가능해야 하므로 requireAdminOrSuper 적용
 * - 그 외 더 민감한 슈퍼 전용 엔드포인트는 필요 시 requireSuper 유지
 *
 * 최종 경로 (app.js에서 app.use('/api/super', router)):
 *   GET  /api/super/site-settings
 *   POST /api/super/site-settings
 */

// 컨트롤러 함수명 프로젝트별 편차를 안전하게 흡수
const getSiteSettings =
  ctrl.getSiteSettings || ctrl.getSettings || ctrl.get || ctrl.load || ctrl.read;
const saveSiteSettings =
  ctrl.saveSiteSettings || ctrl.saveSettings || ctrl.save || ctrl.update || ctrl.set;

if (!getSiteSettings || !saveSiteSettings) {
  console.warn('[superSettingsRoutes] Controller 함수명을 확인하세요 (get/save site-settings)');
}

/** 설정 조회 (admin/super 허용) */
router.get('/site-settings', requireAdminOrSuper, async (req, res, next) => {
  try {
    if (!getSiteSettings) return res.status(500).json({ message: 'getSiteSettings 미구현' });
    return getSiteSettings(req, res, next);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '설정 조회 오류', error: String(e?.message || e) });
  }
});

/** 설정 저장 (admin/super 허용) */
router.post('/site-settings', requireAdminOrSuper, async (req, res, next) => {
  try {
    if (!saveSiteSettings) return res.status(500).json({ message: 'saveSiteSettings 미구현' });
    return saveSiteSettings(req, res, next);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '설정 저장 오류', error: String(e?.message || e) });
  }
});

/* ──────────────────────────────────────────────────────────────
 * (선택) 슈퍼 전용 엔드포인트 예시 — 필요 시 유지
 * router.post('/danger-reset-something', requireSuper, ctrl.dangerReset);
 * ────────────────────────────────────────────────────────────── */

module.exports = router;
