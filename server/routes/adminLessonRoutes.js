// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const lessons = require('../controllers/lessonsController');

// 날짜별 목록 (등원자 기준 + LessonLog 상태)
router.get('/lessons/by-date', isAdmin, lessons.listByDate);

// 단건 즉시 발송
router.post('/lessons/:id/send', isAdmin, lessons.sendOne);

// 선택 발송(여러 건)
router.post('/lessons/send-selected', isAdmin, lessons.sendSelected);

// 예약분 자동 발송(크론에서 호출)
router.post('/lessons/send-bulk', lessons.sendBulk);

module.exports = router;
