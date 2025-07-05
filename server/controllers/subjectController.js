const Subject = require('../models/Subject');

// 과목 전체 조회
exports.getSubjects = async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
};

// 과목 추가
exports.createSubject = async (req, res) => {
  const { name, description } = req.body;
  const subject = await Subject.create({ name, description });
  res.status(201).json(subject);
};

// 과목 수정
exports.updateSubject = async (req, res) => {
  const { name, description } = req.body;
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: '과목 없음' });
  subject.name = name;
  subject.description = description;
  await subject.save();
  res.json(subject);
};

// 과목 삭제
exports.deleteSubject = async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: '과목 없음' });
  await Subject.deleteOne({ _id: req.params.id });
  res.json({ message: '삭제 완료' });
};