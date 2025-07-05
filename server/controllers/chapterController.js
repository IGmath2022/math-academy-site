const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');

// 특정 과목의 모든 단원 조회
exports.getChaptersBySubject = async (req, res) => {
  const { subjectId } = req.params;
  const chapters = await Chapter.find({ subjectId });
  res.json(chapters);
};

// 단원 추가
exports.createChapter = async (req, res) => {
  const { subjectId } = req.params;
  const { name, description, video_url } = req.body;
  const subject = await Subject.findById(subjectId);
  if (!subject) return res.status(404).json({ message: '과목 없음' });
  const chapter = await Chapter.create({ subjectId, name, description, video_url });
  res.status(201).json(chapter);
};

// 단원 수정
exports.updateChapter = async (req, res) => {
  const { id } = req.params;
  const { name, description, video_url } = req.body;
  const chapter = await Chapter.findById(id);
  if (!chapter) return res.status(404).json({ message: '단원 없음' });
  chapter.name = name;
  chapter.description = description;
  chapter.video_url = video_url;
  await chapter.save();
  res.json(chapter);
};

// 단원 삭제
exports.deleteChapter = async (req, res) => {
  const { id } = req.params;
  const chapter = await Chapter.findById(id);
  if (!chapter) return res.status(404).json({ message: '단원 없음' });
  await Chapter.deleteOne({ _id: id });
  res.json({ message: '삭제 완료' });
};