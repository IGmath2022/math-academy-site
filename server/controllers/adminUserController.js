// server/controllers/adminUserController.js
const User = require('../models/User');

/** GET /api/admin/users
 *  쿼리: role(선택: super|admin|teacher|student), q(이름/이메일 검색), active(true|false)
 *  - 슈퍼만 전체 열람
 */
exports.listUsers = async (req, res) => {
  const { role, q, active } = req.query || {};
  const filter = {};
  if (role && ['super','admin','teacher','student'].includes(role)) filter.role = role;
  if (active === 'true') filter.active = true;
  if (active === 'false') filter.active = false;
  if (q) {
    filter.$or = [
      { name:   { $regex: q, $options: 'i' } },
      { email:  { $regex: q, $options: 'i' } }
    ];
  }
  const rows = await User.find(filter).select('-password').sort({ role: 1, name: 1 }).lean();
  res.json(rows);
};

/** POST /api/admin/users/:id/role
 *  body: { role: 'admin'|'teacher'|'student'|'super' }
 *  - 슈퍼만 가능
 *  - 마지막 슈퍼 계정은 박탈 불가
 */
exports.changeRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!['super','admin','teacher','student'].includes(role)) {
    return res.status(400).json({ message: '잘못된 역할' });
  }
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: '사용자 없음' });

  // 마지막 슈퍼 보호
  if (user.role === 'super' && role !== 'super') {
    const superCount = await User.countDocuments({ role: 'super', active: true });
    if (superCount <= 1) {
      return res.status(409).json({ message: '마지막 슈퍼관리자의 권한은 변경할 수 없습니다.' });
    }
  }

  user.role = role;
  await user.save();
  res.json({ ok: true, id: String(user._id), role: user.role });
};

/** POST /api/admin/users/:id/activate
 *  body: { active: boolean }
 *  - 슈퍼/운영 가능 (둘 다 가능)
 *  - 마지막 슈퍼 비활성화 방지
 */
exports.setActive = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body || {};
  if (typeof active !== 'boolean') return res.status(400).json({ message: 'active(boolean) 필요' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: '사용자 없음' });

  if (user.role === 'super' && active === false) {
    const superCount = await User.countDocuments({ role: 'super', active: true });
    if (superCount <= 1) {
      return res.status(409).json({ message: '마지막 슈퍼관리자를 비활성화할 수 없습니다.' });
    }
  }

  user.active = active;
  await user.save();
  res.json({ ok: true, id: String(user._id), active: user.active });
};
