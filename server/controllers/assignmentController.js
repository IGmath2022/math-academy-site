const { Assignment, User, Chapter } = require("../models");

// 학생별 단원(강의) 할당 (운영자)
exports.assignChapterToStudent = async (req, res) => {
  const { userId, chapterId } = req.body;
  // 이미 할당되어 있으면 중복 방지
  const exists = await Assignment.findOne({ where: { userId, chapterId } });
  if (exists) return res.status(409).json({ message: '이미 할당된 강의입니다.' });
  const assignment = await Assignment.create({ userId, chapterId });
  res.status(201).json(assignment);
};

// 학생별 할당된 단원 전체 조회 (학생 대시보드)
exports.getMyAssignments = async (req, res) => {
  const { userId } = req.query;
  const assignments = await Assignment.findAll({
    where: { userId },
    include: [{ model: Chapter }]
  });
  res.json(assignments);
};

// (선택) 학생별 할당 해제 (운영자)
exports.removeAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await Assignment.findByPk(id);
  if (!assignment) return res.status(404).json({ message: '할당 정보 없음' });
  await assignment.destroy();
  res.json({ message: '할당 해제 완료' });
};