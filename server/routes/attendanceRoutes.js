const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { sendAlimtalk } = require('../utils/alimtalk');
const moment = require('moment-timezone');

// 1) 핸드폰 뒷자리로 학생리스트 조회
router.post('/find-students', async (req, res) => {
  const { phoneTail } = req.body;
  if (!phoneTail || phoneTail.length < 4) 
    return res.status(400).json({ message: '핸드폰 뒷4자리를 입력하세요.' });

  const users = await User.find({
    parentPhone: { $regex: phoneTail + '$' },
    active: true
  }).select('_id name parentPhone');
  if (!users.length) return res.status(404).json({ message: '학생 없음' });
  res.json(users);
});

// 2) 등/하원 자동판별 및 처리
router.post('/entry', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: '학생을 선택하세요.' });

  const now = moment().tz('Asia/Seoul');
  const today = now.format('YYYY-MM-DD');
  const time = now.format('HH:mm:ss');

  const student = await User.findById(userId);
  if (!student) return res.status(404).json({ message: '학생 없음' });

  const inRec = await Attendance.findOne({ userId, date: today, type: 'IN' });
  const outRec = await Attendance.findOne({ userId, date: today, type: 'OUT' });

  if (!inRec) {
    // 등원처리
    await Attendance.create({ userId, date: today, type: 'IN', time, auto: false, notified: false });
    await sendAlimtalk(
      student.parentPhone,
      'UB_0082',
      { student_name: student.name, time: now.format('HH:mm'), automsg: '' }
    );
    return res.json({ status: 'IN', message: '등원 처리되었습니다.' });
  } else if (!outRec) {
    // 하원처리
    await Attendance.create({ userId, date: today, type: 'OUT', time, auto: false, notified: false });
    await sendAlimtalk(
      student.parentPhone,
      'UB_0082',
      { student_name: student.name, time: now.format('HH:mm'), automsg: '' }
    );
    return res.json({ status: 'OUT', message: '하원 처리되었습니다.' });
  } else {
    // 이미 등/하원 모두 처리
    return res.status(409).json({ message: '이미 등/하원 모두 완료됨.' });
  }
});

// 3) 자동 하원처리(22:30)
router.post('/auto-leave', async (req, res) => {
  const now = moment().tz('Asia/Seoul');
  const today = now.format('YYYY-MM-DD');
  const studentsIn = await Attendance.find({ date: today, type: 'IN' });

  const result = [];
  for (const rec of studentsIn) {
    const outRec = await Attendance.findOne({ userId: rec.userId, date: today, type: 'OUT' });
    if (!outRec) {
      // 하원기록 없음 → 자동 하원 처리
      const student = await User.findById(rec.userId);
      await Attendance.create({ userId: rec.userId, date: today, type: 'OUT', time: now.format('HH:mm:ss'), auto: true, notified: false });
      await sendAlimtalk(
        student.parentPhone,
        'UB_0082',
        { student_name: student.name, time: now.format('HH:mm'), automsg: '자동 하원 처리되었습니다.' }
      );
      result.push(student.name);
    }
  }
  res.json({ message: `${result.length}명 자동 하원 처리`, students: result });
});

module.exports = router;