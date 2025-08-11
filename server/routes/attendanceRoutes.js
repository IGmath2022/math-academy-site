const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { sendAlimtalk } = require('../utils/alimtalk');
const moment = require('moment-timezone');

// 최소 간격 (분)
const MIN_INTERVAL_MINUTES = 10;

// 시간 간격 + 상태 검증 함수
async function canCheck(userId, type) {
  const now = moment().tz('Asia/Seoul');
  const today = now.format('YYYY-MM-DD');

  const lastRec = await Attendance.findOne({ userId, date: today })
    .sort({ time: -1 })
    .lean();

  if (!lastRec) return { ok: true };

  if (lastRec.type === type) {
    return { ok: false, reason: '이미 같은 상태 처리됨' };
  }

  const lastTime = moment(`${lastRec.date} ${lastRec.time}`, 'YYYY-MM-DD HH:mm:ss');
  if (moment().diff(lastTime, 'minutes') < MIN_INTERVAL_MINUTES) {
    return { ok: false, reason: `${MIN_INTERVAL_MINUTES}분 이내 재처리 불가` };
  }

  return { ok: true };
}

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

// 2) 등원 전용
router.post('/check-in', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: '학생을 선택하세요.' });

  const student = await User.findById(userId);
  if (!student) return res.status(404).json({ message: '학생 없음' });

  const check = await canCheck(userId, 'IN');
  if (!check.ok) return res.status(409).json({ message: check.reason });

  const now = moment().tz('Asia/Seoul');
  const today = now.format('YYYY-MM-DD');
  const time = now.format('HH:mm:ss');

  await Attendance.create({ userId, date: today, type: 'IN', time, auto: false, notified: false });
  await sendAlimtalk(student.parentPhone, 'UB_0082', {
    name: student.name,
    type: '등원',
    time: now.format('HH:mm'),
    automsg: ''
  });
  res.json({ status: 'IN', message: '등원 처리되었습니다.' });
});

// 3) 하원 전용
router.post('/check-out', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: '학생을 선택하세요.' });

  const student = await User.findById(userId);
  if (!student) return res.status(404).json({ message: '학생 없음' });

  const check = await canCheck(userId, 'OUT');
  if (!check.ok) return res.status(409).json({ message: check.reason });

  const now = moment().tz('Asia/Seoul');
  const today = now.format('YYYY-MM-DD');
  const time = now.format('HH:mm:ss');

  await Attendance.create({ userId, date: today, type: 'OUT', time, auto: false, notified: false });
  await sendAlimtalk(student.parentPhone, 'UB_0082', {
    name: student.name,
    type: '하원',
    time: now.format('HH:mm'),
    automsg: ''
  });
  res.json({ status: 'OUT', message: '하원 처리되었습니다.' });
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
      {
        name: student.name,
        type: '등원',
        time: now.format('HH:mm'),
        automsg: ''
      }
    );
    return res.json({ status: 'IN', message: '등원 처리되었습니다.' });
  } else if (!outRec) {
    // 하원처리
    await Attendance.create({ userId, date: today, type: 'OUT', time, auto: false, notified: false });
    await sendAlimtalk(
      student.parentPhone,
      'UB_0082',
      {
        name: student.name,
        type: '하원',
        time: now.format('HH:mm'),
        automsg: ''
      }
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
      await Attendance.create({
        userId: rec.userId,
        date: today,
        type: 'OUT',
        time: now.format('HH:mm:ss'),
        auto: true,
        notified: false
      });
      await sendAlimtalk(
        student.parentPhone,
        'UB_0082',
        {
          name: student.name,
          type: '하원',
          time: now.format('HH:mm'),
          automsg: '자동 하원 처리되었습니다.'
        }
      );
      result.push(student.name);
    }
  }
  res.json({ message: `${result.length}명 자동 하원 처리`, students: result });
});

// 4) 날짜별 출결 (날짜별 등/하원)
router.get('/by-date', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "날짜 필요" });

  // 모든 IN/OUT 기록을 찾음
  const data = await Attendance.find({ date }).populate('userId').lean();

  // 학생별로 등/하원 한 번씩만 표시
  const map = {};
  data.forEach(a => {
    const id = a.userId?._id?.toString() || a.userId;
    if (!map[id]) {
      map[id] = {
        studentId: id,
        studentName: a.userId?.name || "",
        checkIn: null,
        checkOut: null
      };
    }
    if (a.type === 'IN') map[id].checkIn = a.time;
    if (a.type === 'OUT') map[id].checkOut = a.time;
  });
  res.json(Object.values(map));
});

// 5) 학생별 월별 출결
router.get('/by-student', async (req, res) => {
  const { userId, month } = req.query;
  if (!userId || !month) return res.status(400).json({ message: "userId, month 필요" });
  // ex: month = '2025-07'
  const re = new RegExp(`^${month}-\\d{2}$`);
  const data = await Attendance.find({ userId, date: re }).lean();

  // 날짜별로 등/하원 시간 매핑
  const map = {};
  data.forEach(a => {
    if (!map[a.date]) map[a.date] = { date: a.date, checkIn: null, checkOut: null };
    if (a.type === 'IN') map[a.date].checkIn = a.time;
    if (a.type === 'OUT') map[a.date].checkOut = a.time;
  });

  // 월별 등원(출석) 카운트
  const count = Object.values(map).filter(d => !!d.checkIn).length;

  res.json({
    count,
    records: Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  });
});

module.exports = router;