// server/routes/adminUserRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// ë¡œì»¬ ê°€??(isAuthenticated ?„ì— ?¬ìš©)
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
 * ?„ì²´/??• ë³??¬ìš©??ëª©ë¡
 *  - query.role: super|admin|teacher|student (? íƒ)
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
    res.status(500).json({ message: '?¬ìš©??ëª©ë¡ ì¡°íšŒ ?¤ë¥˜', error: String(e?.message || e) });
  }
});

/**
 * POST /api/admin/users
 * ê´€ë¦¬ì/ê°•ì‚¬ ?ì„±
 * body: { name, email, password, role }  // role: 'admin' | 'teacher'
 * (?™ìƒ?€ ?¬ê¸°??ë§Œë“¤ì§€ ?ŠìŒ)
 */
router.post('/', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password ?„ìˆ˜' });
    }
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'role?€ admin ?ëŠ” teacherë§??ˆìš©' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const doc = await User.create({ name, email, password: hashed, role, active: true });
    res.json({ ok: true, userId: doc._id });
  } catch (e) {
    res.status(500).json({ message: '?¬ìš©???ì„± ?¤ë¥˜', error: String(e?.message || e) });
  }
});

/**
 * PATCH /api/admin/users/:id/active
 * ?œì„±/ë¹„í™œ???„í™˜
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
    if (!doc) return res.status(404).json({ message: '?¬ìš©???†ìŒ' });
    res.json({ ok: true, user: { _id: doc._id, active: doc.active } });
  } catch (e) {
    res.status(500).json({ message: '?œì„± ?íƒœ ë³€ê²??¤ë¥˜', error: String(e?.message || e) });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * ??•  ë³€ê²?(?ˆí¼ ?„ìš©) ??admin ??teacher
 * body: { role: 'admin' | 'teacher' }
 */
router.patch('/:id/role', isAuthenticated, onlySuper, async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'role?€ admin ?ëŠ” teacherë§??ˆìš©' });
    }
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: '?¬ìš©???†ìŒ' });
    res.json({ ok: true, user: { _id: doc._id, role: doc.role } });
  } catch (e) {
    res.status(500).json({ message: '??•  ë³€ê²??¤ë¥˜', error: String(e?.message || e) });
  }
});

module.exports = router;







