// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();
const lessons = require('../controllers/lessonsController');
const { requireAdminOrSuper } = require('../middleware/auth');

// 날짜별 레슨 목록 (기존)
router.get('/lessons', requireAdminOrSuper, lessons.listByDate);
router.get('/lessons/by-date', requireAdminOrSuper, lessons.listByDate);

// 출결 단건/업데이트 (기존)
router.get('/attendance/one', requireAdminOrSuper, lessons.getAttendanceOne);
router.post('/attendance/set-times', requireAdminOrSuper, lessons.setAttendanceTimes);

// 자동 발송 토글(기존)
router.get('/settings/daily-auto', requireAdminOrSuper, lessons.getDailyAuto);
router.post('/settings/daily-auto', requireAdminOrSuper, lessons.setDailyAuto);

// (기존) 수동 트리거: 자동하원/일일리포트
const { runAutoLeave } = require('../services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('../services/cron/jobs/dailyReportJob');
const Setting = require('../models/Setting');
const Services = require('../services/cron/servicesAdapter');

router.post('/lessons/auto-leave', requireAdminOrSuper, async (req, res) => {
  try {
    const out = await runAutoLeave({ Setting, Services });
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'auto-leave run failed', error: String(e?.message || e) });
  }
});

router.post('/lessons/send-daily', requireAdminOrSuper, async (req, res) => {
  try {
    const out = await runDailyReport({ Setting, Services });
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'daily-report run failed', error: String(e?.message || e) });
  }
});

// ───────────────────────────────────────────────────────────
// 신규: 레거시 호환 상세 조회
// GET /api/admin/lessons/detail?studentId=...&date=YYYY-MM-DD(옵션)
// ───────────────────────────────────────────────────────────
let hasDetail = typeof lessons.getLessonDetailByStudent === 'function' ||
                typeof lessons.getLessonDetail === 'function';

if (hasDetail) {
  router.get('/lessons/detail', requireAdminOrSuper, async (req, res) => {
    try {
      const fn = lessons.getLessonDetailByStudent || lessons.getLessonDetail;
      const out = await fn(req, res);
      // 위 컨트롤러가 직접 res.json() 했다면 여기서 반환 종료
      if (!res.headersSent) res.json(out);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ message: 'detail failed' });
    }
  });
} else {
  // 컨트롤러에 구현이 없다면 안전한 최소 구현(모델 직접 접근)
  const Lesson = require('../models/Lesson'); // 프로젝트 모델명 기준
  router.get('/lessons/detail', requireAdminOrSuper, async (req, res) => {
    const { studentId, date } = req.query || {};
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });
    try {
      const q = { student: studentId };
      if (date) {
        // 날짜가 오면 해당 날짜의 레슨 우선 조회
        const start = new Date(`${date}T00:00:00.000Z`);
        const end   = new Date(`${date}T23:59:59.999Z`);
        q.date = { $gte: start, $lte: end };
      }
      const doc = await Lesson.findOne(q).sort({ date: -1 }).lean();
      if (!doc) return res.status(404).json({ message: 'lesson not found' });
      res.json(doc);
    } catch (e) {
      res.status(400).json({ message: 'invalid query' });
    }
  });
}

module.exports = router;
