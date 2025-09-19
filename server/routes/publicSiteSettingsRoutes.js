// server/routes/publicSiteSettingsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicSiteSettingsController');

// 기존 공개 설정
router.get('/public', ctrl.getPublicSettings || ctrl.public || ctrl.getPublic);

// 프런트가 /public-settings 를 호출하는 경우를 위한 안전한 별칭(리다이렉트)
router.get('/public-settings', (req, res) => {
  // 307: 메서드 유지 리다이렉트
  return res.redirect(307, '/api/site/public');
});

module.exports = router;
