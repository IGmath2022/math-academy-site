// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();

const { isAuthenticated, isAdmin } = require('../middleware/auth');
const lessons = require('../controllers/lessonsController');

/**
 * app.js 에서 app.use('/api/admin', adminLessonRoutes) 로 마운트됨.
 * 따라서 실제 엔드포인트는 /api/admin/lessons/* 형태가 됩니다.
 */

// ✅ 하위호환: /lessons -> 날짜별 목록
router.get('/lessons', isAdmin, lessons.listByDate);

// 날짜별 목록(신규 경로)
router.get('/lessons/by-date', isAdmin, lessons.listByDate);

// 리포트 단건 상세 (studentId & date)
router.get('/lessons/detail', isAdmin, lessons.getDetail);

// 리포트 작성/수정(업서트)
router.post('/lessons', isAdmin, lessons.createOrUpdate);
router.post('/lessons/upsert', isAdmin, lessons.createOrUpdate);

// 예약 대기 리스트
router.get('/lessons/pending', isAdmin, lessons.listPending);

// 단건 발송
router.post('/lessons/send-one/:id', isAdmin, lessons.sendOne);

// 선택 발송(배열 ids)
router.post('/lessons/send-selected', isAdmin, lessons.sendSelected);

// 예약분 일괄 발송(크론/수동)
router.post('/lessons/send-bulk', isAdmin, lessons.sendBulk);

/* ===========================
 * 출결 수동 수정(관리자용) 추가
 * =========================== */

// 등/하원 1건 조회 (studentId, date 쿼리필수)
// -> GET /api/admin/attendance/one?studentId=...&date=YYYY-MM-DD
router.get('/attendance/one', isAdmin, lessons.getAttendanceOne);

// 등/하원 수동 설정 (body: { studentId, date, checkIn, checkOut, overwrite? })
// -> POST /api/admin/attendance/set-times
router.post('/attendance/set-times', isAdmin, lessons.setAttendanceTimes);

module.exports = router;
