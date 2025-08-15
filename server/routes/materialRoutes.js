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

    // 로컬 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    // DB 저장
    const newMaterial = await Material.create({
      title,
      description,
      file: keyName,
      originalName: req.file.originalname, // 📌 원본 파일명 저장
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

// 📌 파일 직접 다운로드 (프록시 방식)
router.get('/direct-download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: '파일을 찾을 수 없습니다.' });
    }

    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: material.file
    };

    const fileStream = s3.getObject(params).createReadStream();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(material.originalName)}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    fileStream.pipe(res);
  } catch (err) {
    console.error('[파일 직접 다운로드 에러]', err);
    res.status(500).json({ message: '다운로드 실패', error: err.message });
  }
});

module.exports = router;