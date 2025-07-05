const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Chapter = require('../models/Chapter');

// 학생별 단원(강의) 할당 (운영자)
exports.assignChapterToStudent = async (req, res) => {
  const { userId, chapterId } = req.body;
  const exists = await Assignment.findOne({ userId, chapterId });
  if (exists) return res.status(409).json({ message: '이미 할당된 강의입니다.' });
  const assignment = await Assignment.create({ userId, chapterId });
  res.status(201).json(assignment);
};

// 학생별 할당된 단원 전체 조회 (학생 대시보드)
exports.getMyAssignments = async (req, res) => {
  const { userId } = req.query;
  // chapterId populate → Chapter로 전달
  const assignments = await Assignment.find({ userId }).populate('chapterId');
  const mapped = assignments.map(a => ({
    ...a.toObject(),
    Chapter: a.chapterId   // <-- 핵심! 프론트에서 a.Chapter로 접근하도록
  }));
  res.json(mapped);
};

// (선택) 학생별 할당 해제 (운영자)
exports.removeAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ message: '할당 정보 없음' });
  await Assignment.deleteOne({ _id: id });
  res.json({ message: '할당 해제 완료' });
};