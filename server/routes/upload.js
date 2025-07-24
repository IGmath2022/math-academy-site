const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: 'kr-standard',
  endpoint: process.env.NAVER_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NAVER_ACCESS_KEY,
    secretAccessKey: process.env.NAVER_SECRET_KEY,
  },
});

// 학원별 폴더에 파일 업로드 + 폴더별 용량 제한 예시
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const academyId = req.body.academyId || 'default';
  // 1. 폴더별 용량 계산
  const listCmd = new ListObjectsV2Command({
    Bucket: process.env.NAVER_BUCKET,
    Prefix: `academy/${academyId}/`
  });
  const listResult = await s3.send(listCmd);
  const totalSize = (listResult.Contents || []).reduce((sum, obj) => sum + (obj.Size || 0), 0);
  const MAX_SIZE = 1 * 1024 * 1024 * 1024; // 예: 1GB

  if (totalSize + file.size > MAX_SIZE) {
    return res.status(400).json({ message: '학원별 업로드 용량 초과!' });
  }
  // 2. S3 업로드
  const key = `academy/${academyId}/uploads/${Date.now()}_${file.originalname}`;
  const params = {
    Bucket: process.env.NAVER_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read' // (자료실/배너 등 공개필요시)
  };
  await s3.send(new PutObjectCommand(params));
  const url = `${process.env.NAVER_ENDPOINT.replace('https://','https://'+process.env.NAVER_BUCKET+'.')}/${key}`;
  res.json({ url, filename: file.originalname });
});

module.exports = router;