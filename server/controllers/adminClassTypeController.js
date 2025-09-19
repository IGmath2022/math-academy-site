// server/controllers/adminClassTypeController.js
const ClassType = require('../models/ClassType');
const LessonLog = require('../models/LessonLog');

/** GET /api/admin/class-types
 * Optional: ?active=1 → active=true 인 항목만
 * 정렬: active=true 우선, 그 다음 name 오름차순(ko)
 */
exports.list = async (req, res) => {
  try {
    const { active } = req.query || {};
    const where = {};
    if (String(active || '') === '1') where.active = true;
    const rows = await ClassType.find(where).lean();
    rows.sort((a, b) => {
      const aAct = a.active ? 1 : 0;
      const bAct = b.active ? 1 : 0;
      if (aAct !== bAct) return bAct - aAct;
      return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: '목록 조회 오류', error: String(e?.message || e) });
  }
};

/** POST /api/admin/class-types
 * body: { name, active? }
 */
exports.create = async (req, res) => {
  try {
    const { name, active } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'name은 필수' });
    }
    const exists = await ClassType.findOne({ name });
    if (exists) return res.status(409).json({ message: '이미 존재하는 이름' });
    const doc = await ClassType.create({ name: String(name).trim(), active: !!active });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: '생성 오류', error: String(e?.message || e) });
  }
};

/** PUT /api/admin/class-types/:id
 * body: { name?, active? }
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body || {};
    const doc = await ClassType.findById(id);
    if (!doc) return res.status(404).json({ message: '없음' });

    if (name !== undefined) doc.name = String(name).trim();
    if (active !== undefined) doc.active = !!active;
    await doc.save();

    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: '수정 오류', error: String(e?.message || e) });
  }
};

/** DELETE /api/admin/class-types/:id
 * LessonLog 등에서 참조 중이면 삭제 막기(안전)
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const used = await LessonLog.findOne({ classTypeId: id }).lean();
    if (used) {
      return res.status(400).json({ message: '사용중인 수업형태는 삭제할 수 없습니다.' });
    }
    const doc = await ClassType.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: '없음' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: '삭제 오류', error: String(e?.message || e) });
  }
};

/** PATCH /api/admin/class-types/:id/toggle
 * body: { active: boolean }
 */
exports.toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body || {};
    const doc = await ClassType.findByIdAndUpdate(id, { $set: { active: !!active } }, { new: true });
    if (!doc) return res.status(404).json({ message: '없음' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: '토글 오류', error: String(e?.message || e) });
  }
};
