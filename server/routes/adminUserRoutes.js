// server/routes/adminUserRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// 로컬 가드 (isAuthenticated 후에 사용)
function onlyAdminOrSuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: '인증 필요' });
  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({ message: '관리자/슈퍼만 접근 가능' });
  }
  next();
}
function onlySuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: '인증 필요' });
  if (req.user.role !== 'super') {
    return res.status(403).json({ message: '슈퍼관리자만 접근 가능' });
  }
  next();
}

/**
 * GET /api/admin/users
 * 전체/역할별 사용자 목록
 *  - query.role: super|admin|teacher|student (선택)
 */
router.get('/users', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const role = req.query.role;
    const q = role ? { role } : {};
    const rows = await User.find(q).sort({ role: 1, name: 1 }).lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: '사용자 목록 조회 오류', error: String(e?.message || e) });
  }
});

/**
 * POST /api/admin/users
 * 관리자/강사 생성
 * body: { name, email, password, role }  // role: 'admin' | 'teacher'
 * (학생은 여기서 만들지 않음)
 */
router.post('/users', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password 필수' });
    }
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'role은 admin 또는 teacher만 허용' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: '이미 존재하는 이메일' });

    const hashed = await bcrypt.hash(password, 10);
    const doc = await User.create({ name, email, password: hashed, role, active: true });
    res.json({ ok: true, userId: doc._id });
  } catch (e) {
    res.status(500).json({ message: '사용자 생성 오류', error: String(e?.message || e) });
  }
});

/**
 * PATCH /api/admin/users/:id/active
 * 활성/비활성 전환
 * body: { active: boolean }
 */
router.patch('/users/:id/active', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const active = !!req.body?.active;
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { active } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: '사용자 없음' });
    res.json({ ok: true, user: { _id: doc._id, active: doc.active } });
  } catch (e) {
    res.status(500).json({ message: '활성 상태 변경 오류', error: String(e?.message || e) });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * 역할 변경 (슈퍼 전용) — admin ↔ teacher
 * body: { role: 'admin' | 'teacher' }
 */
router.patch('/users/:id/role', isAuthenticated, onlySuper, async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'role은 admin 또는 teacher만 허용' });
    }
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: '사용자 없음' });
    res.json({ ok: true, user: { _id: doc._id, role: doc.role } });
  } catch (e) {
    res.status(500).json({ message: '역할 변경 오류', error: String(e?.message || e) });
  }
});

module.exports = router;
