// server/routes/staffLessonRoutes.js
const express = require('express');
const router = express.Router();
const lessons = require('../controllers/lessonsController');
const { requireStaff } = require('../middleware/auth'); // admin | super | teacher

/**
 * app.js 에서 app.use('/api/staff', staffLessonRoutes)
 * 실제 엔드포인트는 /api/staff/lessons/*, /api/staff/alerts/* 형태
 * - 서버 컨트롤러 내부에서 역할 스코프 검사 수행
 */

// 공통 레슨 목록/상세/업서트
router.get('/lessons',           requireStaff, lessons.listByDate);
router.get('/lessons/by-date',   requireStaff, lessons.listByDate);
router.get('/lessons/detail',    requireStaff, lessons.getDetail);
router.post('/lessons',          requireStaff, lessons.createOrUpdate);
router.post('/lessons/upsert',   requireStaff, lessons.createOrUpdate);

// 예약/발송
router.get('/lessons/pending',        requireStaff, lessons.listPending);
router.post('/lessons/send-one/:id',  requireStaff, lessons.sendOne);
router.post('/lessons/send-selected', requireStaff, lessons.sendSelected);
router.post('/lessons/send-bulk',     requireStaff, lessons.sendBulk);

// 출결 수동
router.get('/attendance/one',         requireStaff, lessons.getAttendanceOne);
router.post('/attendance/set-times',  requireStaff, lessons.setAttendanceTimes);

// 자동발송 스위치(운영/강사 공통 UI)
router.get('/settings/daily-auto',    requireStaff, lessons.getDailyAuto);
router.post('/settings/daily-auto',   requireStaff, lessons.setDailyAuto);

// 강사 대시보드 위젯
router.get('/alerts/today',           requireStaff, lessons.getTodayAlerts);
router.get('/lessons/month-logs',     requireStaff, lessons.getMonthLogs);

module.exports = router;
