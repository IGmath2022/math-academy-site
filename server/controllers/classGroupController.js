// server/controllers/classGroupController.js
const ClassGroup = require('../models/ClassGroup');
const User = require('../models/User');

/** ADMIN/SUPER: 반 목록 */
exports.list = async (req, res) => {
  const { q, active } = req.query || {};
  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (active === 'true') filter.active = true;
  if (active === 'false') filter.active = false;
  const rows = await ClassGroup.find(filter).sort({ active: -1, name: 1 })
    .populate('teachers', 'name email role')
    .populate('students', 'name email role')
    .lean();
  res.json(rows);
};

/** ADMIN/SUPER: 생성 */
exports.create = async (req, res) => {
  const body = req.body || {};
  const doc = await ClassGroup.create(body);
  res.status(201).json({ ok: true, id: String(doc._id) });
};

/** ADMIN/SUPER: 수정 */
exports.update = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const doc = await ClassGroup.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!doc) return res.status(404).json({ message: '반 없음' });
  res.json({ ok: true, id: String(doc._id) });
};

/** ADMIN/SUPER: 교사/학생 배정(덮어씀) */
exports.assign = async (req, res) => {
  const { id } = req.params;
  const { teachers = [], students = [] } = req.body || {};
  const doc = await ClassGroup.findByIdAndUpdate(
    id,
    { $set: { teachers, students } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: '반 없음' });
  res.json({ ok: true, id: String(doc._id) });
};

/** STAFF: 내가 속한 반(강사 기준) */
exports.myGroups = async (req, res) => {
  const me = String(req.user?.id || '');
  const role = req.user?.role;
  const filter = (role === 'teacher')
    ? { teachers: me, active: true }
    : {}; // admin/super는 전체
  const rows = await ClassGroup.find(filter)
    .select('name academy days timeStart timeEnd teachers students active')
    .lean();
  res.json(rows);
};

/** STAFF: 워크로드 (담당 반 수/학생 수) */
exports.myWorkload = async (req, res) => {
  const me = String(req.user?.id || '');
  const role = req.user?.role;

  if (role === 'teacher') {
    const groups = await ClassGroup.find({ teachers: me, active: true })
      .select('students').lean();
    const studentSet = new Set();
    groups.forEach(g => (g.students || []).forEach(s => studentSet.add(String(s))));
    return res.json({
      role,
      groups: groups.length,
      students: studentSet.size
    });
  }

  // admin/super: 전체 요약
  const groups = await ClassGroup.countDocuments({ active: true });
  const all = await ClassGroup.find({ active: true }).select('students').lean();
  const studentSet = new Set();
  all.forEach(g => (g.students || []).forEach(s => studentSet.add(String(s))));
  res.json({ role, groups, students: studentSet.size });
};
