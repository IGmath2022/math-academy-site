// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// 공개 리포트 조회 (인증 없이 보기)
// GET /api/reports/public/:code
router.get('/api/reports/public/:code', async (req, res) => {
  try {
    const { code } = req.params; // LessonLog _id
    const log = await LessonLog.findById(code).lean();
    if (!log) return res.status(404).json({ message: 'NOT_FOUND' });

    const user = await User.findById(log.studentId).lean();

    // 같은 날짜의 등/하원 시간 조회(있으면 포함)
    let checkIn = '', checkOut = '';
    if (log.date && log.studentId) {
      const [inRec, outRec] = await Promise.all([
        Attendance.findOne({ userId: log.studentId, date: log.date, type: 'IN' }).lean(),
        Attendance.findOne({ userId: log.studentId, date: log.date, type: 'OUT' }).lean(),
      ]);
      checkIn = inRec?.time?.slice(0,5) || '';
      checkOut = outRec?.time?.slice(0,5) || '';
    }

    // 공개용 안전 필드만 반환
    res.json({
      id: String(log._id),
      date: log.date,
      studentName: user?.name || '',
      course: log.course || '',
      book: log.book || '',
      content: log.content || '',
      homework: log.homework || '',
      feedback: log.feedback || '',
      classType: log.classType || '',
      teacher: log.teacher || '',
      tags: Array.isArray(log.tags) ? log.tags : [],
      focus: typeof log.focus === 'number' ? log.focus : null,
      durationMin: typeof log.durationMin === 'number' ? log.durationMin : null,
      checkIn,
      checkOut,
    });
  } catch (e) {
    console.error('[reportRoutes] public error:', e);
    res.status(500).json({ message: 'SERVER_ERROR' });
  }
});

module.exports = router;
