const StudentProgress = require('../models/StudentProgress');

exports.checkProgress = async (req, res) => {
  const { userId, chapterId, memo } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  let progress = await StudentProgress.findOne({ userId, chapterId, date: today });
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
  const list = await StudentProgress.find(where);
  res.json(list);
};