// server/routes/adminUserRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// 로컬 가??(isAuthenticated ?�에 ?�용)
function onlyAdminOrSuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admins or super users only' });
  }
  next();
}

function onlySuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role !== 'super') {
    return res.status(403).json({ message: 'Super admin only' });
  }
  next();
}
/**
 * GET /api/admin/users
 * ?�체/??���??�용??목록
 *  - query.role: super|admin|teacher|student (?�택)
 */
router.get('/', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const roleParam = req.query.role;
    let query = {};
    if (roleParam) {
      const roles = Array.isArray(roleParam)
        ? roleParam
        : String(roleParam)
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
      if (roles.length === 1) query.role = roles[0];
      if (roles.length > 1) query.role = { '$in': roles };
    }
    const rows = await User.find(query).sort({ role: 1, name: 1 }).lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: '?�용??목록 조회 ?�류', error: String(e?.message || e) });
  }
});

/**
 * POST /api/admin/users
 * 관리자/강사 ?�성
 * body: { name, email, password, role }  // role: 'admin' | 'teacher'
 * (?�생?� ?�기??만들지 ?�음)
 */
router.post('/', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password ?�수' });
    }
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'role?� admin ?�는 teacher�??�용' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const doc = await User.create({ name, email, password: hashed, role, active: true });
    res.json({ ok: true, userId: doc._id });
  } catch (e) {
    res.status(500).json({ message: '?�용???�성 ?�류', error: String(e?.message || e) });
  }
});

/**
 * PATCH /api/admin/users/:id/active
 * ?�성/비활???�환
 * body: { active: boolean }
 */
router.patch('/:id/active', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const active = !!req.body?.active;
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { active } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: '?�용???�음' });
    res.json({ ok: true, user: { _id: doc._id, active: doc.active } });
  } catch (e) {
    res.status(500).json({ message: '?�성 ?�태 변�??�류', error: String(e?.message || e) });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * ??�� 변�?(?�퍼 ?�용) ??admin ??teacher
 * body: { role: 'admin' | 'teacher' }
 */
router.patch('/:id/role', isAuthenticated, onlySuper, async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'role?� admin ?�는 teacher�??�용' });
    }
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: '?�용???�음' });
    res.json({ ok: true, user: { _id: doc._id, role: doc.role } });
  } catch (e) {
    res.status(500).json({ message: '??�� 변�??�류', error: String(e?.message || e) });
  }
});

// 강사 계정 목록 조회 (콘텐츠 관리용)
router.get('/teachers/accounts', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const teacherAccounts = await User.find({ role: 'teacher', active: true })
      .select('name email')
      .lean();
    res.json(teacherAccounts);
  } catch (err) {
    console.error('[강사 계정 목록 조회 에러]', err);
    res.status(500).json({ message: '강사 계정 목록 조회 실패', error: String(err) });
  }
});

module.exports = router;







