const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { isAdmin } = require('../middleware/auth');

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

// 배너 이미지 업로드
router.post('/upload', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "파일 없음" });

    const key = `banners/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    await s3.send(new PutObjectCommand(params));

    // public URL 반환
    const publicUrl = `${process.env.REACT_APP_R2_PUBLIC_URL}/${key}`;
    res.json({ url: publicUrl });
  } catch (err) {
    console.error("[배너 업로드 에러]", err);
    res.status(500).json({ message: "배너 업로드 실패", error: String(err) });
  }
});

module.exports = router;