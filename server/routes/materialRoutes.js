const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// multer: temp 폴더에 임시 저장
const upload = multer({ dest: 'temp/' });

// 네이버 클라우드 Object Storage (S3 호환)
const s3 = new S3Client({
  region: 'kr-standard',
  endpoint: process.env.NAVER_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NAVER_ACCESS_KEY,
    secretAccessKey: process.env.NAVER_SECRET_KEY
  }
});
const BUCKET = process.env.NAVER_BUCKET;

// 자료 목록
router.get('/', async (req, res) => {
  const list = await Material.find().sort({ createdAt: -1 });
  res.json(list);
});

// 자료 업로드
router.post('/', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const fileContent = fs.readFileSync(req.file.path);
    const fileExt = path.extname(req.file.originalname);
    const fileKey = `materials/${Date.now()}${fileExt}`;

    // 네이버 클라우드 업로드
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      Body: fileContent,
      ACL: 'public-read', // 퍼블릭 접근 가능
      ContentType: req.file.mimetype
    }));

    // 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    // 파일 URL 생성
    const fileUrl = `${process.env.NAVER_ENDPOINT}/${BUCKET}/${fileKey}`;

    // DB 저장
    const newMaterial = await Material.create({
      title,
      description,
      file: fileUrl
    });

    res.status(201).json(newMaterial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '업로드 실패' });
  }
});

// 자료 삭제 (클라우드에서도 삭제)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const mat = await Material.findById(req.params.id);
    if (!mat) return res.status(404).json({ message: '자료 없음' });

    // URL에서 Key 추출
    const fileKey = mat.file.split(`/${BUCKET}/`)[1];
    if (fileKey) {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: fileKey
      }));
    }

    await Material.deleteOne({ _id: req.params.id });
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '삭제 실패' });
  }
});

module.exports = router;