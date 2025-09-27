const express = require('express');
const router = express.Router();
const Curriculum = require('../models/Curriculum');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 전체 교육과정 목록 조회
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const curricula = await Curriculum.find({ isActive: true })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ grade: 1, createdAt: -1 });

    res.json(curricula);
  } catch (error) {
    res.status(500).json({ message: '교육과정 조회 실패', error: error.message });
  }
});

// 특정 교육과정 상세 조회
router.get('/:courseId', isAuthenticated, async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({
      courseId: req.params.courseId,
      isActive: true
    })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '교육과정 조회 실패', error: error.message });
  }
});

// 새 교육과정 생성 (관리자만)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { courseId, courseName, subject, grade, chapters } = req.body;

    // 중복 courseId 확인
    const existing = await Curriculum.findOne({ courseId });
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 과정 ID입니다' });
    }

    const curriculum = new Curriculum({
      courseId,
      courseName,
      subject: subject || '수학',
      grade,
      chapters: chapters || [],
      createdBy: req.user.id
    });

    await curriculum.save();
    await curriculum.populate('createdBy', 'name');

    res.status(201).json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '교육과정 생성 실패', error: error.message });
  }
});

// 교육과정 수정 (관리자만)
router.put('/:courseId', isAdmin, async (req, res) => {
  try {
    const { courseName, subject, grade, chapters } = req.body;

    const curriculum = await Curriculum.findOneAndUpdate(
      { courseId: req.params.courseId },
      {
        courseName,
        subject,
        grade,
        chapters,
        updatedBy: req.user.id
      },
      { new: true }
    )
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '교육과정 수정 실패', error: error.message });
  }
});

// 교육과정 삭제 (비활성화) (관리자만)
router.delete('/:courseId', isAdmin, async (req, res) => {
  try {
    const curriculum = await Curriculum.findOneAndUpdate(
      { courseId: req.params.courseId },
      {
        isActive: false,
        updatedBy: req.user.id
      },
      { new: true }
    );

    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    res.json({ message: '교육과정이 비활성화되었습니다' });
  } catch (error) {
    res.status(500).json({ message: '교육과정 삭제 실패', error: error.message });
  }
});

// 단원 추가 (관리자만)
router.post('/:courseId/chapters', isAdmin, async (req, res) => {
  try {
    const { chapterId, chapterName, types } = req.body;

    const curriculum = await Curriculum.findOne({ courseId: req.params.courseId });
    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    // 중복 chapterId 확인
    if (curriculum.findChapter(chapterId)) {
      return res.status(400).json({ message: '이미 존재하는 단원 ID입니다' });
    }

    curriculum.addChapter({
      chapterId,
      chapterName,
      types: types || []
    });

    curriculum.updatedBy = req.user.id;
    await curriculum.save();

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '단원 추가 실패', error: error.message });
  }
});

// 단원 수정 (관리자만)
router.put('/:courseId/chapters/:chapterId', isAdmin, async (req, res) => {
  try {
    const { chapterName, types } = req.body;

    const curriculum = await Curriculum.findOne({ courseId: req.params.courseId });
    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    const chapter = curriculum.findChapter(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ message: '단원을 찾을 수 없습니다' });
    }

    if (chapterName) chapter.chapterName = chapterName;
    if (types) chapter.types = types;

    curriculum.updatedBy = req.user.id;
    await curriculum.save();

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '단원 수정 실패', error: error.message });
  }
});

// 단원 삭제 (관리자만)
router.delete('/:courseId/chapters/:chapterId', isAdmin, async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ courseId: req.params.courseId });
    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    const chapterIndex = curriculum.chapters.findIndex(c => c.chapterId === req.params.chapterId);
    if (chapterIndex === -1) {
      return res.status(404).json({ message: '단원을 찾을 수 없습니다' });
    }

    curriculum.chapters.splice(chapterIndex, 1);
    curriculum.updatedBy = req.user.id;
    await curriculum.save();

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '단원 삭제 실패', error: error.message });
  }
});

// 유형 추가 (관리자만)
router.post('/:courseId/chapters/:chapterId/types', isAdmin, async (req, res) => {
  try {
    const { typeId, typeName } = req.body;

    const curriculum = await Curriculum.findOne({ courseId: req.params.courseId });
    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    const chapter = curriculum.findChapter(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ message: '단원을 찾을 수 없습니다' });
    }

    // 중복 typeId 확인
    if (chapter.types.find(t => t.typeId === typeId)) {
      return res.status(400).json({ message: '이미 존재하는 유형 ID입니다' });
    }

    curriculum.addType(req.params.chapterId, { typeId, typeName });
    curriculum.updatedBy = req.user.id;
    await curriculum.save();

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '유형 추가 실패', error: error.message });
  }
});

// 유형 삭제 (관리자만)
router.delete('/:courseId/chapters/:chapterId/types/:typeId', isAdmin, async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ courseId: req.params.courseId });
    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    const chapter = curriculum.findChapter(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ message: '단원을 찾을 수 없습니다' });
    }

    const typeIndex = chapter.types.findIndex(t => t.typeId === req.params.typeId);
    if (typeIndex === -1) {
      return res.status(404).json({ message: '유형을 찾을 수 없습니다' });
    }

    chapter.types.splice(typeIndex, 1);
    curriculum.updatedBy = req.user.id;
    await curriculum.save();

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '유형 삭제 실패', error: error.message });
  }
});

// 단원 순서 변경 (관리자만)
router.put('/:courseId/chapters/reorder', isAdmin, async (req, res) => {
  try {
    const { chapterOrders } = req.body; // [{ chapterId, order }]

    const curriculum = await Curriculum.findOne({ courseId: req.params.courseId });
    if (!curriculum) {
      return res.status(404).json({ message: '교육과정을 찾을 수 없습니다' });
    }

    // 순서 업데이트
    chapterOrders.forEach(({ chapterId, order }) => {
      const chapter = curriculum.findChapter(chapterId);
      if (chapter) {
        chapter.order = order;
      }
    });

    curriculum.updatedBy = req.user.id;
    await curriculum.save();

    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: '단원 순서 변경 실패', error: error.message });
  }
});

// 특정 학년의 교육과정 조회
router.get('/grade/:grade', isAuthenticated, async (req, res) => {
  try {
    const curricula = await Curriculum.find({
      grade: req.params.grade,
      isActive: true
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(curricula);
  } catch (error) {
    res.status(500).json({ message: '학년별 교육과정 조회 실패', error: error.message });
  }
});

module.exports = router;