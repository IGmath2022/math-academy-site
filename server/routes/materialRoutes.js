const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Material = require('../models/Material');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();
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
    if (!req.file) return res.status(400).json({ message: '파일이 없습니다.' });

    const originalName = req.file.originalname;
    const keyName = `academy/${Date.now()}_${encodeURIComponent(originalName)}`;
    const fileStream = fs.createReadStream(req.file.path);

    const uploadResult = await s3.upload({
      Bucket: process.env.R2_BUCKET,
      Key: keyName,
      Body: fileStream,
      ACL: 'private' // 다운로드는 presigned URL만 가능
    }).promise();

    fs.unlinkSync(req.file.path);

    const newMaterial = await Material.create({
      title,
      description,
      file: keyName,
      originalName
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

// 📌 파일 다운로드 링크 (사전 서명 URL)
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: '자료가 없습니다.' });

    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.R2_BUCKET,
      Key: material.file,
      Expires: 3600,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(material.originalName)}`
    });

    res.json({ url });
  } catch (err) {
    console.error('[파일 다운로드 에러]', err);
    res.status(500).json({ message: '다운로드 실패', error: err.message });
  }
});

// 📌 파일 삭제 (R2 + DB)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: '자료를 찾을 수 없습니다.' });

    await s3.deleteObject({
      Bucket: process.env.R2_BUCKET,
      Key: material.file
    }).promise();

    await material.deleteOne();

    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error('[파일 삭제 에러]', err);
    res.status(500).json({ message: '삭제 실패', error: err.message });
  }
});

module.exports = router;