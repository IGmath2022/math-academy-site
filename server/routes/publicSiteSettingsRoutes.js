// server/routes/publicSiteSettingsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicSiteSettingsController');

// 공개 조회(비로그인 포함)
router.get('/public-settings', ctrl.getPublic);

module.exports = router;
