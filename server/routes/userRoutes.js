const express = require('express');
const router = express.Router();
const { User, School, SchoolPeriod } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 내 정보 조회
router.get('/me', isAuthenticated, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      { model: School, include: [SchoolPeriod] }
    ]
  });
  if (!user) return res.status(404).json({ message: "사용자 없음" });
  res.json(user);
});

// 전체 사용자(학생 등) 목록, 활성/비활성 분리 지원!
router.get('/', isAdmin, async (req, res) => {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  // 활성/비활성 학생 분리
  if (req.query.active === "false") where.active = false;
  else if (req.query.active === "true") where.active = true;
  // 기본값: 활성화만 (쿼리 없으면 true)
  else if (!("active" in req.query)) where.active = true;

  const users = await User.findAll({
    where,
    include: [{ model: School }]
  });
  res.json(users);
});

// 특정 사용자 상세
router.get('/:id', isAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: School, attributes: ['id', 'name'] }]
  });
  if (!user) return res.status(404).json({ message: '유저 없음' });
  res.json(user);
});

// 사용자 수정
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "사용자 없음" });

    const { name, email, schoolId } = req.body;
    if (schoolId) {
      const school = await School.findByPk(schoolId);
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

// 사용자 삭제
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "유저 없음" });
    await user.destroy();
    res.json({ message: "삭제 완료" });
  } catch (e) {
    res.status(500).json({ message: "삭제 실패", error: String(e) });
  }
});

// 활성/비활성 토글
router.patch('/:id/active', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "유저 없음" });
    user.active = !!req.body.active;
    await user.save();
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ message: "비활성화/활성화 실패", error: String(e) });
  }
});

module.exports = router;