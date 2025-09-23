// server/routes/publicSiteSettingsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicSiteSettingsController');

// 주의: 상대경로('/')만 사용 (app.js에서 어떤 경로로 마운트하든 동작)
router.get('/', ctrl.getPublic);
// 필요 시 관리자 인증 미들웨어 추가
router.put('/', /* requireAdminOrSuper, */ ctrl.putPublic);

module.exports = router;
