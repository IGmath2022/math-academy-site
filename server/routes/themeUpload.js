// server/routes/themeUpload.js
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Cloudflare R2 설정
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 슈퍼 권한 체크
function onlySuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role !== 'super') {
    return res.status(403).json({ message: 'Super admin only' });
  }
  next();
}

// 로고 업로드 (헤더, 파비콘, 로딩)
router.post('/upload/logo', isAuthenticated, onlySuper, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body; // 'header', 'favicon', 'loading'

    if (!file) return res.status(400).json({ message: "파일 없음" });
    if (!['header', 'favicon', 'loading'].includes(type)) {
      return res.status(400).json({ message: "잘못된 로고 타입" });
    }

    const key = `theme/logos/${type}/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    await s3.send(new PutObjectCommand(params));
    const publicUrl = `${process.env.REACT_APP_R2_PUBLIC_URL}/${key}`;

    res.json({ url: publicUrl, type });
  } catch (err) {
    console.error("[로고 업로드 에러]", err);
    res.status(500).json({ message: "로고 업로드 실패", error: String(err) });
  }
});

// 강사 사진 업로드
router.post('/upload/teacher', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "파일 없음" });

    const key = `theme/teachers/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    await s3.send(new PutObjectCommand(params));
    const publicUrl = `${process.env.REACT_APP_R2_PUBLIC_URL}/${key}`;

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("[강사 사진 업로드 에러]", err);
    res.status(500).json({ message: "강사 사진 업로드 실패", error: String(err) });
  }
});

// 갤러리 이미지 업로드
router.post('/upload/gallery', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { category } = req.body; // 'facility', 'class', 'event'

    if (!file) return res.status(400).json({ message: "파일 없음" });

    const key = `theme/gallery/${category || 'general'}/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    await s3.send(new PutObjectCommand(params));
    const publicUrl = `${process.env.REACT_APP_R2_PUBLIC_URL}/${key}`;

    res.json({ url: publicUrl, category });
  } catch (err) {
    console.error("[갤러리 업로드 에러]", err);
    res.status(500).json({ message: "갤러리 업로드 실패", error: String(err) });
  }
});

module.exports = router;