const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');
const Chapter = require('../models/Chapter');

// 학생별/전체 진도 조회
exports.getProgress = async (req, res) => {
  try {
    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.chapterId) where.chapterId = req.query.chapterId;
    // userId, chapterId populate해서 프론트에서 더 쉽게 활용 가능하게
    const progress = await StudentProgress.find(where).populate('userId chapterId');
    res.json(progress);
  } catch (e) {
    console.error('[진도조회에러]', e);
    res.status(500).json({ message: '진도 정보 조회 실패', error: e.toString() });
  }
};

// 진도 기록/수정 (student)
exports.saveProgress = async (req, res) => {
  const { userId, chapterId, memo } = req.body;
  if (!userId || !chapterId) {
    return res.status(400).json({ message: "userId, chapterId 필수" });
  }
  const date = new Date().toISOString().slice(0, 10);
  try {
    let progress = await StudentProgress.findOne({ userId, chapterId, date });
    if (progress) {
      progress.memo = memo;
      await progress.save();
    } else {
      progress = await StudentProgress.create({ userId, chapterId, date, memo });
    }
    res.json(progress);
  } catch (e) {
    console.error("[진도 저장 에러]", e);
    res.status(500).json({ message: "진도 저장 실패", error: e.toString() });
  }
};