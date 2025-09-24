// server/routes/siteContentRoutes.js
const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// 관리자 이상 권한 체크
function onlyAdminOrSuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admins or super users only' });
  }
  next();
}

// GET /api/content - 사이트 콘텐츠 조회 (공개)
router.get('/', async (req, res) => {
  try {
    let content = await SiteContent.findOne();
    if (!content) {
      // 기본 콘텐츠 생성
      content = new SiteContent({
        aboutSection: {
          title: '학원 소개',
          content: '수학의 정석과 함께 체계적인 수학 교육을 받으세요.',
          features: [
            { icon: '📚', title: '개인별 맞춤 수업', description: '학생 개개인의 수준에 맞는 맞춤형 교육' },
            { icon: '👥', title: '소수정예 클래스', description: '집중도 높은 소규모 그룹 수업' },
            { icon: '📈', title: '체계적인 커리큘럼', description: '단계별 학습으로 확실한 실력 향상' }
          ]
        }
      });
      await content.save();
    }
    res.json(content);
  } catch (err) {
    console.error('[사이트 콘텐츠 조회 에러]', err);
    res.status(500).json({ message: '사이트 콘텐츠 조회 실패', error: String(err) });
  }
});

// PUT /api/content/banners - 배너 슬라이드 업데이트
router.put('/banners', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { bannerSlides } = req.body;

    let content = await SiteContent.findOne();
    if (!content) {
      content = new SiteContent();
    }

    content.bannerSlides = bannerSlides || [];
    await content.save();

    res.json({ success: true, bannerSlides: content.bannerSlides });
  } catch (err) {
    console.error('[배너 슬라이드 저장 에러]', err);
    res.status(500).json({ message: '배너 슬라이드 저장 실패', error: String(err) });
  }
});

// PUT /api/content/about - 소개 섹션 업데이트
router.put('/about', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { aboutSection } = req.body;

    let content = await SiteContent.findOne();
    if (!content) {
      content = new SiteContent();
    }

    content.aboutSection = { ...content.aboutSection, ...aboutSection };
    await content.save();

    res.json({ success: true, aboutSection: content.aboutSection });
  } catch (err) {
    console.error('[소개 섹션 저장 에러]', err);
    res.status(500).json({ message: '소개 섹션 저장 실패', error: String(err) });
  }
});

// GET /api/content/teachers/accounts - 계정관리의 강사 목록 조회
router.get('/teachers/accounts', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const teacherAccounts = await User.find({ role: 'teacher', active: true })
      .select('name email')
      .lean();

    res.json(teacherAccounts);
  } catch (err) {
    console.error('[강사 계정 목록 조회 에러]', err);
    res.status(500).json({ message: '강사 계정 목록 조회 실패', error: String(err) });
  }
});

// PUT /api/content/teachers - 강사진 업데이트 (User 계정과 연동)
router.put('/teachers', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { teachers } = req.body;

    let content = await SiteContent.findOne();
    if (!content) {
      content = new SiteContent();
    }

    content.teachers = teachers || [];
    await content.save();

    res.json({ success: true, teachers: content.teachers });
  } catch (err) {
    console.error('[강사진 저장 에러]', err);
    res.status(500).json({ message: '강사진 저장 실패', error: String(err) });
  }
});

// POST /api/content/teachers/sync - 계정관리의 강사를 강사진에 동기화
router.post('/teachers/sync', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { userId } = req.body;

    // User 정보 가져오기
    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // SiteContent에서 기존 강사진 확인
    let content = await SiteContent.findOne();
    if (!content) {
      content = new SiteContent();
    }

    // 이미 연동된 강사인지 확인
    const existingTeacher = content.teachers.find(t => t.userId && t.userId.toString() === userId);
    if (existingTeacher) {
      return res.status(400).json({ message: '이미 강사진에 등록된 계정입니다.' });
    }

    // 새 강사를 강사진에 추가
    const newTeacher = {
      userId: userId,
      name: user.name,
      email: user.email,
      photo: '',
      position: '강사',
      education: '',
      experience: '',
      subjects: [],
      order: content.teachers.length,
      visible: true
    };

    content.teachers.push(newTeacher);
    await content.save();

    res.json({ success: true, teacher: newTeacher });
  } catch (err) {
    console.error('[강사 동기화 에러]', err);
    res.status(500).json({ message: '강사 동기화 실패', error: String(err) });
  }
});

// PUT /api/content/gallery - 갤러리 업데이트
router.put('/gallery', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { gallery } = req.body;

    let content = await SiteContent.findOne();
    if (!content) {
      content = new SiteContent();
    }

    content.gallery = gallery || [];
    await content.save();

    res.json({ success: true, gallery: content.gallery });
  } catch (err) {
    console.error('[갤러리 저장 에러]', err);
    res.status(500).json({ message: '갤러리 저장 실패', error: String(err) });
  }
});

// PUT /api/content/contact - 연락처 섹션 업데이트
router.put('/contact', isAuthenticated, onlyAdminOrSuper, async (req, res) => {
  try {
    const { contactSection } = req.body;

    let content = await SiteContent.findOne();
    if (!content) {
      content = new SiteContent();
    }

    content.contactSection = { ...content.contactSection, ...contactSection };
    await content.save();

    res.json({ success: true, contactSection: content.contactSection });
  } catch (err) {
    console.error('[연락처 섹션 저장 에러]', err);
    res.status(500).json({ message: '연락처 섹션 저장 실패', error: String(err) });
  }
});

module.exports = router;