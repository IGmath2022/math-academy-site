// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();

// ✅ 반드시 함수로 import (괄호로 호출 금지!)
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// ✅ lessonsController의 내보낸 함수들 연결
const lessons = require('../controllers/lessonsController');

/**
 * 주의:
 * - app.js 에서 app.use('/api/admin', adminLessonRoutes) 로 마운트되어 있으므로,
 *   여기서는 '/lessons/...' 로만 작성합니다.
 * - 미들웨어는 함수 그대로 전달해야 하며 isAdmin() 처럼 호출하면 안 됩니다.
 */

// 날짜별 목록 (등원 OR 해당일 로그 존재 학생)
router.get('/lessons/by-date', isAdmin, lessons.listByDate);

// 리포트 단건 상세 (학생+날짜)
router.get('/lessons/detail', isAdmin, lessons.getDetail);

// 리포트 작성/수정(업서트)
// - 에디터에서 POST /api/admin/lessons 로 호출하므로 이 라우트 필요
router.post('/lessons', isAdmin, lessons.createOrUpdate);

// 동일 동작을 /upsert 경로로도 지원 (Sender에서 사용)
router.post('/lessons/upsert', isAdmin, lessons.createOrUpdate);

// 예약 대기 리스트
router.get('/lessons/pending', isAdmin, lessons.listPending);

// 단건 발송
router.post('/lessons/send-one/:id', isAdmin, lessons.sendOne);

// 선택 발송 (여러 건)
router.post('/lessons/send-selected', isAdmin, lessons.sendSelected);

// 예약분 일괄 발송 (크론/수동)
router.post('/lessons/send-bulk', isAdmin, lessons.sendBulk);

module.exports = router;
