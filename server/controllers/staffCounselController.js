// server/controllers/staffCounselController.js
const moment = require('moment-timezone');
const CounselLog = require('../models/CounselLog');
const User = require('../models/User');
let ClassGroup = null;
try { ClassGroup = require('../models/ClassGroup'); } catch { /* optional */ }

const KST = 'Asia/Seoul';

// 강사 스코프: 본인이 담당인 반의 학생들만 허용
async function getAllowedStudentIdsForTeacher(userId) {
  if (!ClassGroup) return []; // 모델 없으면 제한 불가 → 빈 배열로 막음
  const groups = await ClassGroup.find({ teachers: userId, active: true })
    .select('students')
    .lean();
  const set = new Set(groups.flatMap(g => (g.students || []).map(String)));
  return Array.from(set);
}

/** GET /api/staff/counsel?month=YYYY-MM
 *  - teacher: 본인 반 학생만
 *  - admin/super: 전체
 */
exports.listByMonth = async (req, res) => {
  try {
    const month = (req.query.month || moment().tz(KST).format('YYYY-MM')).slice(0, 7);
    const dateRegex = new RegExp(`^${month}-\\d{2}$`);

    const role = req.user?.role;
    const q = { date: { $regex: dateRegex } };

    if (role === 'teacher') {
      const allowed = await getAllowedStudentIdsForTeacher(req.user.id);
      if (allowed.length === 0) return res.json({ ok: true, month, items: [] });
      q.studentId = { $in: allowed };
    }

    const rows = await CounselLog.find(q).sort({ date: -1, _id: -1 }).lean();

    // 학생 이름 매핑
    const ids = Array.from(new Set(rows.map(r => String(r.studentId))));
    const users = await User.find({ _id: { $in: ids } }).select('_id name').lean();
    const nameById = Object.fromEntries(users.map(u => [String(u._id), u.name]));

    const items = rows.map(r => ({
      _id: String(r._id),
      studentId: String(r.studentId),
      studentName: nameById[String(r.studentId)] || '',
      date: r.date,            // YYYY-MM-DD
      memo: r.memo || '',
      publicOn: !!r.publicOn,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ ok: true, month, items });
  } catch (e) {
    console.error('[staffCounselController.listByMonth]', e);
    res.status(500).json({ ok: false, message: '상담 목록 조회 실패', error: String(e?.message || e) });
  }
};

/** POST /api/staff/counsel
 *  body: { studentId, date(YYYY-MM-DD), memo, publicOn }
 *  - teacher: 본인 반 학생만 작성/수정 가능
 *  - upsert(studentId+date)
 */
exports.upsert = async (req, res) => {
  try {
    const { studentId, date, memo = '', publicOn = false } = req.body || {};
    if (!studentId || !date) return res.status(400).json({ ok: false, message: 'studentId, date 필수' });

    if (req.user?.role === 'teacher') {
      const allowed = await getAllowedStudentIdsForTeacher(req.user.id);
      if (!allowed.includes(String(studentId))) {
        return res.status(403).json({ ok: false, message: '담당 학생이 아닙니다.' });
      }
    }

    const doc = await CounselLog.findOneAndUpdate(
      { studentId, date },
      { $set: { memo: String(memo).slice(0, 3000), publicOn: !!publicOn } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, doc });
  } catch (e) {
    console.error('[staffCounselController.upsert]', e);
    res.status(500).json({ ok: false, message: '상담 저장 실패', error: String(e?.message || e) });
  }
};

/** DELETE /api/staff/counsel/:id
 *  - teacher: 본인 반 학생의 로그만 삭제 가능
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await CounselLog.findById(id).lean();
    if (!row) return res.json({ ok: true }); // idempotent

    if (req.user?.role === 'teacher') {
      const allowed = await getAllowedStudentIdsForTeacher(req.user.id);
      if (!allowed.includes(String(row.studentId))) {
        return res.status(403).json({ ok: false, message: '담당 학생이 아닙니다.' });
      }
    }

    await CounselLog.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) {
    console.error('[staffCounselController.remove]', e);
    res.status(500).json({ ok: false, message: '상담 삭제 실패', error: String(e?.message || e) });
  }
};
