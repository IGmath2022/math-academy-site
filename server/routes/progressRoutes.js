const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/progressController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 진도(Progress) 전체/개별 조회
router.get('/', isAuthenticated, ctrl.getProgress);

// 진도 기록/수정 (학생/운영자)
router.post('/', isAuthenticated, ctrl.saveProgress);

module.exports = router;