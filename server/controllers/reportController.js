// server/controllers/reportController.js
const { verifyToken } = require('../utils/reportToken');
const LessonLog = require('../models/LessonLog');
const User = require('../models/User');

exports.view = async (req, res) => {
  const t = req.query.t;
  const d = req.query.d; // 하이라이트할 날짜(선택)
  const payload = verifyToken(t);
  if (!payload?.sid) return res.status(401).send('링크가 만료되었거나 유효하지 않습니다.');

  const student = await User.findById(payload.sid).lean();
  if (!student) return res.status(404).send('학생 정보를 찾을 수 없습니다.');

  // 최근 10회 + 간단 요약(집중도 평균)
  const items = await LessonLog.find({ studentId: payload.sid })
    .sort({ date: -1, _id: -1 })
    .limit(10)
    .lean();

  const focusVals = items.map(i => Number(i.focus || 0)).filter(n => !isNaN(n));
  const focusAvg = focusVals.length ? (focusVals.reduce((a,b)=>a+b,0) / focusVals.length).toFixed(1) : '0.0';

  res.json({
    student: { id: String(student._id), name: student.name },
    highlightDate: d || null,
    focusAvg,
    items
  });
};
