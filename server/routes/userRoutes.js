const express = require('express');
const router = express.Router();
const User = require('../models/User');
const School = require('../models/School');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/me', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.user.id).populate('schoolId');
  if (!user) return res.status(404).json({ message: "사용자 없음" });
  res.json(user);
});

router.get('/', isAdmin, async (req, res) => {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.active === "false") where.active = false;
  else if (req.query.active === "true") where.active = true;
  else if (!("active" in req.query)) where.active = true;
  const users = await User.find(where).populate('schoolId');
  res.json(users);
});

router.get('/:id', isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).populate('schoolId');
  if (!user) return res.status(404).json({ message: '유저 없음' });
  res.json(user);
});

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