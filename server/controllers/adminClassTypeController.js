// server/controllers/adminClassTypeController.js
const ClassType = require('../models/ClassType');
const LessonLog = require('../models/LessonLog');

/** GET /api/admin/class-types
 * name 오름차순 + active=true 먼저 보이도록 정렬
 */
exports.list = async (_req, res) => {
  const rows = await ClassType.find().lean();
  rows.sort((a, b) => {
    // active(true) 우선, 그 다음 name
    const aAct = a.active ? 1 : 0;
    const bAct = b.active ? 1 : 0;
    if (aAct !== bAct) return bAct - aAct;
    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  });
  res.json(rows);
};

/** POST /api/admin/class-types  body: { name, active? } */
exports.create = async (req, res) => {
  const { name, active = true } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name 필수' });
  }
  try {
    const doc = await ClassType.create({ name: String(name).trim(), active: !!active });
    res.status(201).json(doc);
  } catch (e) {
    res.status(409).json({ message: '생성 실패(중복명 가능성)', error: String(e?.message || e) });
  }
};

/** PUT /api/admin/class-types/:id  body: { name?, active? } */
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, active } = req.body || {};
  const $set = {};
  if (name != null)   $set.name = String(name).trim();
  if (active != null) $set.active = !!active;

  try {
    const doc = await ClassType.findByIdAndUpdate(id, { $set }, { new: true });
    if (!doc) return res.status(404).json({ message: '없음' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: '수정 실패', error: String(e?.message || e) });
  }
};

/** DELETE /api/admin/class-types/:id
 * 이미 LessonLog.classType에서 사용 중이면 409 로 막기
 */
exports.remove = async (req, res) => {
  const { id } = req.params;
  const d = await ClassType.findById(id).lean();
  if (!d) return res.status(404).json({ message: '없음' });

  const inUse = await LessonLog.exists({ classType: d.name });
  if (inUse) {
    return res.status(409).json({ message: '이미 사용 중인 수업형태입니다. 비활성 처리(active=false)를 권장합니다.' });
  }

  await ClassType.findByIdAndDelete(id);
  res.json({ ok: true });
};

/** PATCH /api/admin/class-types/:id/toggle  body: { active: boolean } */
exports.toggle = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body || {};
  const doc = await ClassType.findByIdAndUpdate(id, { $set: { active: !!active } }, { new: true });
  if (!doc) return res.status(404).json({ message: '없음' });
  res.json(doc);
};
