const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const Material = require('../models/Material');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// 🔹 Multer 메모리 저장소 사용 (로컬에 저장 안 함)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 네이버 클라우드 Object Storage 설정
const s3 = new AWS.S3({
  endpoint: process.env.NAVER_ENDPOINT, // 예: https://kr.object.ncloudstorage.com
  region: 'kr-standard', // NCP 기본 리전
  credentials: {
    accessKeyId: process.env.NAVER_ACCESS_KEY,
    secretAccessKey: process.env.NAVER_SECRET_KEY,
  },
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
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    // S3 업로드 키 생성
    const fileKey = `materials/${Date.now()}_${req.file.originalname}`;

    // S3 업로드
    const uploadResult = await s3
      .putObject({
        Bucket: process.env.NAVER_BUCKET,
        Key: fileKey,
        Body: req.file.buffer,
        ACL: 'public-read', // 공개 URL 접근 가능
        ContentType: req.file.mimetype,
      })
      .promise();

    console.log("네이버 업로드 결과:", uploadResult);

    // DB 저장 (파일 URL 포함)
    const fileUrl = `https://${process.env.NAVER_BUCKET}.${process.env.NAVER_ENDPOINT.replace('https://', '')}/${fileKey}`;

    const newMaterial = await Material.create({
      title,
      description,
      file: fileUrl,
    });

    res.status(201).json(newMaterial);
  } catch (err) {
    console.error("자료 업로드 중 에러:", err);
    res.status(500).json({ message: '서버 에러 발생', error: err.message });
  }
});

// 📌 자료 삭제
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const mat = await Material.findById(req.params.id);
    if (!mat) return res.status(404).json({ message: '자료 없음' });

    // 파일 키 추출 (S3에서 삭제)
    const fileKey = mat.file.split('.com/')[1]; // URL에서 Key 부분 추출
    await s3
      .deleteObject({
        Bucket: process.env.NAVER_BUCKET,
        Key: fileKey,
      })
      .promise();

    // DB에서 삭제
    await Material.deleteOne({ _id: req.params.id });

    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error("자료 삭제 중 에러:", err);
    res.status(500).json({ message: '서버 에러 발생', error: err.message });
  }
});

module.exports = router;