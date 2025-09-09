// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/lessonsController');

// 날짜별 목록(등원 ∪ 로그)
router.get('/lessons', isAdmin, ctrl.listByDate);

// 단건 조회/업서트
router.get('/lessons/detail', isAdmin, ctrl.getDetail);
router.post('/lessons', isAdmin, ctrl.createOrUpdate);

// 시리즈(최근 N회)
router.get('/lessons/series/:studentId', isAdmin, ctrl.getSeries);

// 발송
router.post('/lessons/send-one/:id', isAdmin, ctrl.sendOne);
router.post('/lessons/send-selected', isAdmin, ctrl.sendSelected);
router.post('/lessons/send-bulk', isAdmin, ctrl.sendBulk);
router.get('/lessons/pending', isAdmin, ctrl.listPending);

module.exports = router;
