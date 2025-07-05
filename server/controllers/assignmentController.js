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
  const assignments = await Assignment.find({ userId }).populate('chapterId').lean();
  // chapterId는 string, chapterName도 함께 내려줌
  const patched = assignments.map(a => ({
    ...a,
    chapterId: a.chapterId && a.chapterId._id ? a.chapterId._id.toString() : "",
    chapterName: a.chapterId && a.chapterId.name ? a.chapterId.name : ""
  }));
  res.json(patched);
};

// (선택) 학생별 할당 해제 (운영자)
exports.removeAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ message: '할당 정보 없음' });
  await Assignment.deleteOne({ _id: id });
  res.json({ message: '할당 해제 완료' });
};