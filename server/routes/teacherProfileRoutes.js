// server/routes/teacherProfileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const TeacherProfile = require('../models/TeacherProfile');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { requireStaff } = require('../middleware/auth');

// Multer 설정 (메모리에 임시 저장)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 클라우드 업로드 함수들 (기존 것 재사용)
const uploadToR2 = async (buffer, filename, mimetype) => {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: `teachers/${filename}`,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);
  return `${process.env.REACT_APP_R2_PUBLIC_URL}/teachers/${filename}`;
};

// 모든 강사 프로필 조회 (관리자용)
router.get('/admin', requireStaff, async (req, res) => {
  try {
    const profiles = await TeacherProfile.find()
      .populate('userId', 'name email active')
      .populate('subjects', 'name')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json(profiles);
  } catch (error) {
    console.error('강사 프로필 조회 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 특정 강사 프로필 조회 (관리자용)
router.get('/admin/:userId', requireStaff, async (req, res) => {
  try {
    let profile = await TeacherProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'name email active')
      .populate('subjects', 'name');

    if (!profile) {
      // 프로필이 없으면 기본 프로필 생성
      const user = await User.findById(req.params.userId);
      if (!user || user.role !== 'teacher') {
        return res.status(404).json({ message: '강사를 찾을 수 없습니다.' });
      }

      profile = new TeacherProfile({ userId: req.params.userId });
      await profile.save();
      await profile.populate('userId', 'name email active');
      await profile.populate('subjects', 'name');
    }

    res.json(profile);
  } catch (error) {
    console.error('강사 프로필 조회 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 강사 프로필 업데이트 (관리자용)
router.put('/admin/:userId', requireStaff, async (req, res) => {
  try {
    const {
      experience,
      biography,
      subjects,
      displayOrder,
      isPublic,
      specialties,
      education,
      certifications
    } = req.body;

    let profile = await TeacherProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      profile = new TeacherProfile({ userId: req.params.userId });
    }

    // 필드 업데이트
    if (experience !== undefined) profile.experience = experience;
    if (biography !== undefined) profile.biography = biography;
    if (subjects !== undefined) profile.subjects = subjects;
    if (displayOrder !== undefined) profile.displayOrder = displayOrder;
    if (isPublic !== undefined) profile.isPublic = isPublic;
    if (specialties !== undefined) profile.specialties = specialties;
    if (education !== undefined) profile.education = education;
    if (certifications !== undefined) profile.certifications = certifications;

    await profile.save();
    await profile.populate('userId', 'name email active');
    await profile.populate('subjects', 'name');

    res.json(profile);
  } catch (error) {
    console.error('강사 프로필 업데이트 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 강사 사진 업로드 (관리자용)
router.post('/admin/:userId/upload-image', requireStaff, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }

    const userId = req.params.userId;
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.${req.file.originalname.split('.').pop()}`;

    // R2에 업로드
    const imageUrl = await uploadToR2(req.file.buffer, filename, req.file.mimetype);

    // 프로필 업데이트
    let profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      profile = new TeacherProfile({ userId });
    }

    profile.profileImage = imageUrl;
    await profile.save();

    res.json({
      message: '이미지 업로드 성공',
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
  }
});

// 공개용 강사진 목록 조회 (인증 불필요)
router.get('/public', async (req, res) => {
  try {
    const profiles = await TeacherProfile.find({
      isPublic: true
    })
    .populate('userId', 'name')
    .populate('subjects', 'name')
    .sort({ displayOrder: 1, createdAt: -1 });

    // 활성화된 강사만 필터링
    const activeProfiles = profiles.filter(profile =>
      profile.userId && profile.userId.active !== false
    );

    res.json(activeProfiles);
  } catch (error) {
    console.error('공개 강사진 조회 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;