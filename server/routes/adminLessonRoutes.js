// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();

const { isAuthenticated, isAdmin } = require('../middleware/auth');
const lessons = require('../controllers/lessonsController');

// ★ 모든 admin/lessons 트래픽 로깅 (디버깅용)
router.use('/lessons', (req, _res, next) => {
  console.log(`[ADMIN][LESSONS] ${req.method} ${req.originalUrl}`);
  next();
});

// 날짜별 목록(등원 ∪ 로그보유)
router.get('/lessons/by-date', isAuthenticated, isAdmin, lessons.listByDate);

// 리포트 1건 상세
router.get('/lessons/detail', isAuthenticated, isAdmin, lessons.getDetail);

// 작성/수정(업서트)
router.post('/lessons/upsert', isAuthenticated, isAdmin, lessons.createOrUpdate);

// 예약 대기 목록
router.get('/lessons/pending', isAuthenticated, isAdmin, lessons.listPending);

// 1건 발송
router.post('/lessons/send-one/:id', isAuthenticated, isAdmin, lessons.sendOne);

// 선택 발송(여러 건)
router.post('/lessons/send-selected', isAuthenticated, isAdmin, lessons.sendSelected);

// 자동 발송(예약분; 크론이 때릴 엔드포인트)
router.post('/lessons/send-bulk', lessons.sendBulk);

module.exports = router;
