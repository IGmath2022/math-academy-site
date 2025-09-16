// server/routes/superSettingsRoutes.js
const express = require('express');
const router = express.Router();
const { requireSuper } = require('../middleware/auth');
const ctrl = require('../controllers/superSettingsController');

// 슈퍼 관리자만 접근
router.get('/super/site-settings', requireSuper, ctrl.getSiteSettings);
router.post('/super/site-settings', requireSuper, ctrl.saveSiteSettings);

module.exports = router;
