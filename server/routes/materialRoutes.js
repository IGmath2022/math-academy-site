const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const Material = require('../models/Material');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer 저장 경로
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 네이버 클라우드 S3 설정
const s3 = new AWS.S3({
  endpoint: process.env.NAVER_ENDPOINT,
  region: 'kr-standard',
  credentials: {
    accessKeyId: process.env.NAVER_ACCESS_KEY,
    secretAccessKey: process.env.NAVER_SECRET_KEY
  }
});

// 자료 목록 조회
router.get('/', async (req, res) => {
  const list = await Material.find().sort({ createdAt: -1 });
  res.json(list);
});

// 자료 업로드
router.post('/', isAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log("📂 업로드 요청");
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    if (!req.file) {
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    const fileStream = fs.createReadStream(req.file.path);
    const keyName = `${Date.now()}_${req.file.originalname}`;

    // 네이버 클라우드 업로드
    const uploadResult = await s3.upload({
      Bucket: process.env.NAVER_BUCKET,
      Key: keyName,
      Body: fileStream,
      ACL: 'public-read'
    }).promise();

    console.log("✅ 네이버 업로드 성공:", uploadResult.Location);

    // DB 저장
    const newMaterial = await Material.create({
      title: req.body.title,
      description: req.body.description,
      file: uploadResult.Location
    });

    // 로컬 파일 삭제
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("⚠ 로컬 파일 삭제 실패:", err);
      else console.log("🗑 로컬 파일 삭제 완료:", req.file.path);
    });

    res.status(201).json(newMaterial);

  } catch (err) {
    console.error("❌ 업로드 중 에러:", err);
    res.status(500).json({ message: '업로드 실패', error: err.message });
  }
});

// 자료 다운로드 (네이버 URL이므로 실제로는 안쓰일 수 있음)
router.get('/download/:filename', (req, res) => {
  const file = __dirname + '/../uploads/' + req.params.filename;
  res.download(file);
});

// 자료 삭제
router.delete('/:id', isAdmin, async (req, res) => {
  const mat = await Material.findById(req.params.id);
  if (!mat) return res.status(404).json({ message: '자료 없음' });

  // S3에서 파일 삭제
  const key = mat.file.split('/').pop();
  try {
    await s3.deleteObject({
      Bucket: process.env.NAVER_BUCKET,
      Key: key
    }).promise();
    console.log("🗑 네이버 파일 삭제 완료:", key);
  } catch (err) {
    console.error("⚠ 네이버 파일 삭제 실패:", err);
  }

  await Material.deleteOne({ _id: req.params.id });
  res.json({ message: '삭제 완료' });
});

module.exports = router;