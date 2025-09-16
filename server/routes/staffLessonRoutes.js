// server/routes/staffLessonRoutes.js
const express = require('express');
const router = express.Router();
const { requireStaff, requireAdminOrSuper } = require('../middleware/auth');
const ctrl = require('../controllers/staffLessonController');

/**
 * app.js 에서 app.use('/api/staff', staffLessonRoutes)
 * 실제 엔드포인트는 /api/staff/lessons/*, /api/staff/alerts/* 형태
 * - 컨트롤러 내부에서 강사 스코프(내 반 학생만) 검사 수행
 * - 관리자/슈퍼는 전체 가시권
 */

// 레슨 목록/상세/업서트 (하위호환 포함)
router.get('/lessons',           requireStaff, ctrl.listByDate);   // alias
router.get('/lessons/by-date',   requireStaff, ctrl.listByDate);
router.get('/lessons/detail',    requireStaff, ctrl.getDetail);
router.post('/lessons',          requireStaff, ctrl.createOrUpdate); // alias
router.post('/lessons/upsert',   requireStaff, ctrl.createOrUpdate);

// 선택 발송(강사/운영자 모두 사용, 강사는 스코프 내에서만)
router.post('/lessons/send-selected', requireStaff, ctrl.sendSelected);

// 출결 수동
router.get('/attendance/one',         requireStaff, ctrl.getAttendanceOne);
router.post('/attendance/set-times',  requireStaff, ctrl.setAttendanceTimes);

// 자동발송 스위치
// - GET: 스태프 모두 조회 가능
// - POST: 실제 변경은 관리자/슈퍼만
router.get('/settings/daily-auto',    requireStaff,        ctrl.getDailyAuto);
router.post('/settings/daily-auto',   requireAdminOrSuper, ctrl.setDailyAuto);

// 강사 대시보드 위젯/월간 로그
router.get('/alerts/today',           requireStaff, ctrl.alertsToday);
router.get('/lessons/month-logs',     requireStaff, ctrl.listMonthLogs);

module.exports = router;
