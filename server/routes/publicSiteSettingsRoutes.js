// server/routes/publicSiteSettingsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicSiteSettingsController');

// ⚠️ 상대경로만 사용합니다. (app.js에서 어떤 경로로 마운트하든 동작)
router.get('/public', (req, res, next) => {
  console.log('🚀 /public route called');
  ctrl.getPublic(req, res, next);
});
// 구 경로 호환: /public-settings → /public 로 307
router.get('/public-settings', (req, res) => {
  res.redirect(307, req.baseUrl.replace(/\/+$/, '') + '/public');
});

// 저장(관리자에서만 사용 시 권한 미들웨어 추가)
router.put('/public', /* requireAdminOrSuper, */ ctrl.putPublic);

module.exports = router;
