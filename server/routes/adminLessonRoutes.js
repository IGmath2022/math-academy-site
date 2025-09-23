// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();

const { requireAdminOrSuper } = require('../middleware/auth');
const lessons = require('../controllers/lessonsController');

/**
 * app.js 에서 app.use('/api/admin', adminLessonRoutes) 로 마운트됨.
 * 실제 엔드포인트는 /api/admin/lessons/* 형태.
 */

/* ===========================
 * 날짜별 목록 (하위호환 + 신규)
 * =========================== */
router.get('/lessons', requireAdminOrSuper, lessons.listByDate);
router.get('/lessons/by-date', requireAdminOrSuper, lessons.listByDate);

/* ===========================
 * (추가) 레슨 상세
 *   GET /api/admin/lessons/detail?studentId=...&date=YYYY-MM-DD(옵션)
 *   → controllers/lessonsController.getDetail 사용
 * =========================== */
router.get('/lessons/detail', requireAdminOrSuper, lessons.getDetail);

/* ===========================
 * (추가) 레슨 생성/수정
 *   POST /api/admin/lessons
 *   → controllers/lessonsController.createOrUpdate 사용
 *   (DailyReportEditor / DailyReportSender가 호출)
 * =========================== */
router.post('/lessons', requireAdminOrSuper, lessons.createOrUpdate);

/* ===========================
 * 출결 수동 수정(관리자/슈퍼)
 * =========================== */
router.get('/attendance/one', requireAdminOrSuper, lessons.getAttendanceOne);
router.post('/attendance/set-times', requireAdminOrSuper, lessons.setAttendanceTimes);

/* ===========================
 * 자동발송 ON/OFF (관리자/슈퍼)
 * =========================== */
router.get('/settings/daily-auto', requireAdminOrSuper, lessons.getDailyAuto);
router.post('/settings/daily-auto', requireAdminOrSuper, lessons.setDailyAuto);

module.exports = router;