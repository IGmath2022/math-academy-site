// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();

const { requireAdminOrSuper } = require('../middleware/auth');
const lessons = require('../controllers/lessonsController');

/**
 * app.js 에서 app.use('/api/admin', adminLessonRoutes) 로 마운트됨.
 * 실제 엔드포인트는 /api/admin/lessons/* 형태.
 */

// 날짜별 목록 (하위호환 + 신규)
router.get('/lessons', requireAdminOrSuper, lessons.listByDate);
router.get('/lessons/by-date', requireAdminOrSuper, lessons.listByDate);

// 리포트 상세
router.get('/lessons/detail', requireAdminOrSuper, lessons.getDetail);

// 작성/수정(업서트)
router.post('/lessons', requireAdminOrSuper, lessons.createOrUpdate);
router.post('/lessons/upsert', requireAdminOrSuper, lessons.createOrUpdate);

// 예약 대기
router.get('/lessons/pending', requireAdminOrSuper, lessons.listPending);

// 발송
router.post('/lessons/send-one/:id', requireAdminOrSuper, lessons.sendOne);
router.post('/lessons/send-selected', requireAdminOrSuper, lessons.sendSelected);
router.post('/lessons/send-bulk', requireAdminOrSuper, lessons.sendBulk);

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
