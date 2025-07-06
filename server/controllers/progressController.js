const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');
const Chapter = require('../models/Chapter');

// 진도 조회
exports.getProgress = async (req, res) => {
  try {
    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.chapterId) where.chapterId = req.query.chapterId;
    const progress = await StudentProgress.find(where).populate('userId chapterId');
    res.json(progress);
  } catch (e) {
    console.error('[진도조회에러]', e);
    res.status(500).json({ message: '진도 정보 조회 실패', error: e.toString() });
  }
};

// 진도 저장/수정
exports.saveProgress = async (req, res) => {
  const { userId, chapterId, memo, checked } = req.body;

  // 방어: 필수값 체크
  if (!userId || !chapterId) {
    console.warn("[진도저장 400]", req.body);
    return res.status(400).json({ message: "userId, chapterId 필수" });
  }
  const date = new Date().toISOString().slice(0, 10);

  try {
    let progress = await StudentProgress.findOne({ userId, chapterId, date });
    if (progress) {
      progress.memo = memo;
      // checked 로직 필요하다면 progress.checked = checked; 등 추가
      await progress.save();
    } else {
      progress = await StudentProgress.create({ userId, chapterId, date, memo /*, checked*/ });
    }
    res.json(progress);
  } catch (e) {
    console.error("[진도 저장 에러]", e, req.body);  // 에러와 req.body 동시에 확인!
    res.status(500).json({ message: "진도 저장 실패", error: e.toString() });
  }
};