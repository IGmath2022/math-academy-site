// server/controllers/staffCounselController.js
const CounselLog = require('../models/CounselLog');
const ClassGroup = require('../models/ClassGroup');
const User = require('../models/User');

/** 강사 스코프: 본인이 담당한 반의 학생만 접근 */
async function getTeacherScopeStudentIds(req) {
  const role = req.user?.role;
  const uid = String(req.user?.id || '');
  if (role === 'super' || role === 'admin') return null; // 무제한
  if (role !== 'teacher') return new Set([uid]);         // 학생이면 자기 자신만
  const groups = await ClassGroup.find({ teachers: uid, active: true }).select('students').lean();
  const ids = new Set();
  groups.forEach(g => (g.students || []).forEach(s => ids.add(String(s))));
  return ids;
}

/** GET /api/staff/counsel?month=YYYY-MM
 *  - CounselLog 기준 목록 (student 이름 포함)
 */
exports.listByMonth = async (req, res) => {
  const month = String(req.query.month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'month 형식: YYYY-MM' });
  }
  const begin = `${month}-01`;
  const end   = `${month}-31`;

  const scope = await getTeacherScopeStudentIds(req);

  const filter = { date: { $gte: begin, $lte: end } };
  if (scope) filter.studentId = { $in: [...scope] };

  const rows = await CounselLog.find(filter)
    .populate('studentId', 'name')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  res.json(rows.map(r => ({
    id: String(r._id),
    date: r.date,
    student: r.studentId?.name || '',
    studentId: String(r.studentId?._id || ''),
    memo: r.memo || '',
    publicOn: !!r.publicOn,
  })));
};

/** POST /api/staff/counsel/upsert
 * body: { id?, date, studentId, memo, publicOn }
 * - 강사는 스코프 학생만 작성/수정 가능
 * - admin/super는 제한 없음
 */
exports.upsert = async (req, res) => {
  const body = req.body || {};
  if (!body.date || !body.studentId) {
    return res.status(400).json({ message: 'date, studentId 필수' });
  }
  // 유효 학생?
  const student = await User.findById(body.studentId).select('_id').lean();
  if (!student) return res.status(404).json({ message: '학생 없음' });

  // 스코프 검사(teacher일 때만)
  const scope = await getTeacherScopeStudentIds(req);
  if (scope && !scope.has(String(body.studentId))) {
    return res.status(403).json({ message: '접근 권한이 없습니다.' });
  }

  const payload = {
    date: body.date,
    studentId: body.studentId,
    memo: (body.memo || '').slice(0, 4000),
    publicOn: !!body.publicOn,
  };

  if (body.id) {
    const doc = await CounselLog.findById(body.id);
    if (!doc) return res.status(404).json({ message: '상담 기록 없음' });

    // teacher면 스코프 확인만 통과하면 수정 허용(작성자 필드는 모델에 없음)
    doc.date = payload.date;
    doc.studentId = payload.studentId;
    doc.memo = payload.memo;
    doc.publicOn = payload.publicOn;
    await doc.save();
    return res.json({ ok: true, id: String(doc._id) });
  }

  const created = await CounselLog.create(payload);
  res.status(201).json({ ok: true, id: String(created._id) });
};

/** DELETE /api/staff/counsel/:id
 * - teacher는 스코프 학생 레코드만 삭제 가능
 * - admin/super 무제한
 */
exports.remove = async (req, res) => {
  const { id } = req.params;
  const doc = await CounselLog.findById(id).lean();
  if (!doc) return res.status(404).json({ message: '상담 기록 없음' });

  const scope = await getTeacherScopeStudentIds(req);
  if (scope && !scope.has(String(doc.studentId))) {
    return res.status(403).json({ message: '삭제 권한이 없습니다.' });
  }

  await CounselLog.deleteOne({ _id: id });
  res.json({ ok: true });
};
