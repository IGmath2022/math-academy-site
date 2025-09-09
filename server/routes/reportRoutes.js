// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, issueToken } = require('../utils/reportToken');
const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Setting = require('../models/Setting');

// 공개: JWT 파라미터로 누적 리포트 JSON 제공(프론트 붙이기 전 임시)
router.get('/report', async (req, res) => {
  const t = req.query.t;
  const d = req.query.d;
  const payload = verifyToken(t);
  if (!payload?.sid) return res.status(401).send('링크가 만료되었거나 유효하지 않습니다.');

  const student = await User.findById(payload.sid).lean();
  if (!student) return res.status(404).send('학생 정보를 찾을 수 없습니다.');

  const query = { studentId: payload.sid };
  const items = await LessonLog.find(query).sort({ date: -1, _id: -1 }).limit(10).lean();

  res.json({
    student: { id: String(student._id), name: student.name },
    highlightDate: d || null,
    items
  });
});

// 버튼 변수를 위한 짧은 링크 → JWT 부여 후 /report 로 리다이렉트
router.get('/r/:code', async (req, res) => {
  try {
    const log = await LessonLog.findById(req.params.code).lean();
    if (!log) return res.status(404).send('유효하지 않은 링크입니다.');

    const expDays = Number((await Setting.findOne({ key: 'report_jwt_exp_days' }))?.value || 7);
    const t = issueToken({ studentId: log.studentId, days: expDays, ver: 1 });

    res.redirect(`/report?t=${encodeURIComponent(t)}&d=${encodeURIComponent(log.date)}`);
  } catch {
    res.status(400).send('잘못된 링크입니다.');
  }
});

module.exports = router;
