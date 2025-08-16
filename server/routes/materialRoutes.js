const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Material = require('../models/Material');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: 파일을 임시로 로컬에 저장
const upload = multer({ dest: 'uploads/' });

// Cloudflare R2 연결 설정
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT, // 예: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
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
    const originalName = req.file.originalname; // 원본 파일명 (한글 포함)
    if (!req.file) {
      return res.status(400).json({ message: '파일이 없습니다.' });
    }

    // R2에 저장할 Key는 안전하게 (UUID/랜덤 문자열)
    const keyName = `academy/${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const fileStream = fs.createReadStream(req.file.path);

    const uploadResult = await s3
      .upload({
        Bucket: process.env.R2_BUCKET,
        Key: keyName,
        Body: fileStream,
        ACL: 'private' // presigned URL로만 접근 가능
      })
      .promise();

    // 업로드 후 로컬 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    // DB 저장 (한글 포함 원본 파일명 저장)
    const newMaterial = await Material.create({
      title,
      description,
      file: keyName,        // R2 Key
      originalName          // 원본 파일명
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

// 📌 파일 다운로드 (presigned URL 생성)
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: '자료를 찾을 수 없습니다.' });
    }

    // presigned URL 생성 + 한글 파일명 안전 처리
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

// 📌 자료 삭제 (DB + R2 동시 삭제)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: '자료를 찾을 수 없습니다.' });
    }

    // R2에서 삭제
    await s3.deleteObject({
      Bucket: process.env.R2_BUCKET,
      Key: material.file
    }).promise();

    // DB에서 삭제
    await material.deleteOne();

    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).json({ message: '삭제 실패', error: err.message });
  }
});

module.exports = router;