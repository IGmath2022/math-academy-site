const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Material = require('../models/Material');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: 파일 임시 저장
const upload = multer({ dest: 'uploads/' });

// Cloudflare R2 연결 설정
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4'
});

// 📌 자료 목록 조회
router.get('/', async (req, res) => {
  const list = await Material.find().sort({ createdAt: -1 });
  res.json(list);
});

// 📌 자료 업로드
router.post('/', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: '파일이 없습니다.' });
    }

    const keyName = `academy/${Date.now()}_${req.file.originalname}`;
    const fileStream = fs.createReadStream(req.file.path);

    const uploadResult = await s3
      .upload({
        Bucket: process.env.R2_BUCKET,
        Key: keyName,
        Body: fileStream,
        ACL: 'public-read'
      })
      .promise();

    fs.unlinkSync(req.file.path);

    const newMaterial = await Material.create({
      title,
      description,
      file: keyName,
      originalName: req.file.originalname,
      userId: req.user?._id || null
    });

    res.status(201).json({
      ...newMaterial.toObject(),
      url: uploadResult.Location
    });
  } catch (err) {
    console.error('[파일 업로드 에러]', err);
    res.status(500).json({ message: '파일 업로드 실패', error: err.message });
  }
});

// 📌 사전 서명된 URL 발급 (브라우저가 직접 다운로드)
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: '파일을 찾을 수 없습니다.' });
    }

    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.R2_BUCKET,
      Key: material.file,
      Expires: 60, // 1분간 유효
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(material.originalName)}"`
    });

    res.json({ url: signedUrl });
  } catch (err) {
    console.error('[사전 서명 URL 발급 에러]', err);
    res.status(500).json({ message: '다운로드 실패', error: err.message });
  }
});

module.exports = router;