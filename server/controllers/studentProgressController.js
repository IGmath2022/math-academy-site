const { StudentProgress } = require("../models");

exports.checkProgress = async (req, res) => {
  const { userId, chapterId, memo } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  // 이미 오늘 체크했으면 update, 아니면 insert
  let progress = await StudentProgress.findOne({ where: { userId, chapterId, date: today } });
  if (progress) {
    progress.memo = memo;
    await progress.save();
  } else {
    progress = await StudentProgress.create({ userId, chapterId, date: today, memo });
  }
  res.json({ success: true, progress });
};

exports.listProgress = async (req, res) => {
  const { userId } = req.query;
  const where = userId ? { userId } : {};
  const list = await StudentProgress.findAll({ where });
  res.json(list);
};