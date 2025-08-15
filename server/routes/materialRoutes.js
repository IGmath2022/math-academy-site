const express = require('express');
const multer = require('multer');
const path = require('path');
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
  region: 'auto', // R2는 region 자동 설정
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

    // R2 버킷 업로드 경로
    const keyName = `academy/${Date.now()}_${req.file.originalname}`;
    const fileStream = fs.createReadStream(req.file.path);

    const uploadResult = await s3
      .upload({
        Bucket: process.env.R2_BUCKET, // R2 버킷 이름
        Key: keyName,
        Body: fileStream,
        ACL: 'public-read' // 공개 접근 허용
      })
      .promise();

    // 업로드 후 로컬 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    // DB 저장
    const newMaterial = await Material.create({
      title,
      description,
      file: keyName // R2 키 저장
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

// 📌 파일 다운로드 링크 제공
router.get('/download/:key', async (req, res) => {
  try {
    const key = req.params.key;

    // 사전 서명된 URL 생성 (유효기간 1시간)
    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Expires: 3600
    });

    res.json({ url });
  } catch (err) {
    console.error('[파일 다운로드 에러]', err);
    res.status(500).json({ message: '다운로드 실패', error: err.message });
  }
});

module.exports = router;