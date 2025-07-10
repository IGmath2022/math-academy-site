const express = require('express');
const router = express.Router();
const User = require('../models/User');
const School = require('../models/School');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 내 정보 조회 (schoolId는 학교 객체로 내려감. 필요시 아래 방식 적용)
router.get('/me', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: 'schoolId',
      populate: {
        path: 'SchoolPeriods',
        model: 'SchoolPeriod'
      }
    });
  if (!user) return res.status(404).json({ message: "사용자 없음" });
  res.json(user);
});

// 학생/유저 리스트 (schoolId → string, schoolName 추가 변환)
router.get('/', isAdmin, async (req, res) => {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.active === "false") where.active = false;
  else if (req.query.active === "true") where.active = true;
  else if (!("active" in req.query)) where.active = true;
  
  // 핵심: lean(), map()으로 schoolId 변환
  const users = await User.find(where).populate('schoolId').lean();
  const patched = users.map(u => ({
    ...u,
    schoolId: u.schoolId ? u.schoolId._id.toString() : "",
    schoolName: u.schoolId ? u.schoolId.name : ""
  }));
  res.json(patched);
});

// 학생/유저 단일 조회 (schoolId → string, schoolName 추가 변환)
router.get('/:id', isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).populate('schoolId').lean();
  if (!user) return res.status(404).json({ message: '유저 없음' });
  user.schoolId = user.schoolId ? user.schoolId._id.toString() : "";
  user.schoolName = user.schoolId ? user.schoolId.name : "";
  res.json(user);
});

// 수정
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "사용자 없음" });
    const { name, email, schoolId } = req.body;
    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) return res.status(400).json({ message: "해당 학교 없음" });
      user.schoolId = schoolId;
    }
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "학생 정보 수정 오류", error: String(e) });
  }
});

// 삭제
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "유저 없음" });
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: "삭제 완료" });
  } catch (e) {
    res.status(500).json({ message: "삭제 실패", error: String(e) });
  }
});

// 활성/비활성
router.patch('/:id/active', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "유저 없음" });
    user.active = !!req.body.active;
    await user.save();
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ message: "비활성화/활성화 실패", error: String(e) });
  }
});

module.exports = router;