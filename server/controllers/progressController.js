const { Progress, User, Chapter } = require("../models");

// 학생별/전체 진도 조회
exports.getProgress = async (req, res) => {
  const where = {};
  if (req.query.userId) where.userId = req.query.userId;
  if (req.query.chapterId) where.chapterId = req.query.chapterId;
  const progress = await Progress.findAll({
    where,
    include: [{ model: User }, { model: Chapter }]
  });
  res.json(progress);
};

// 진도 기록/수정 (student)
exports.saveProgress = async (req, res) => {
  const { userId, chapterId, memo } = req.body;
  const date = new Date().toISOString().slice(0, 10);
  let progress = await Progress.findOne({ where: { userId, chapterId, date } });
  if (progress) {
    progress.memo = memo;
    await progress.save();
  } else {
    progress = await Progress.create({ userId, chapterId, date, memo });
  }
  res.json(progress);
};