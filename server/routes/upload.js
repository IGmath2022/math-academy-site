const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const upload = multer({ storage: multer.memoryStorage() });

// Cloudflare R2 연결
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // 예: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const academyId = req.body.academyId || 'default';

    // 1. 폴더별 총 용량 계산
    const listCmd = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      Prefix: `academy/${academyId}/`
    });
    const listResult = await s3.send(listCmd);
    const totalSize = (listResult.Contents || []).reduce((sum, obj) => sum + (obj.Size || 0), 0);
    const MAX_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

    if (totalSize + file.size > MAX_SIZE) {
      return res.status(400).json({ message: '학원별 업로드 용량 초과!' });
    }

    // 2. 파일 업로드
    const key = `academy/${academyId}/uploads/${Date.now()}_${file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    // 3. 퍼블릭 URL 생성
    const url = `${process.env.REACT_APP_R2_PUBLIC_URL}/${key}`;

    res.json({ url, filename: file.originalname });
  } catch (e) {
    console.error('[파일 업로드 에러]', e);
    res.status(500).json({ message: '파일 업로드 중 서버 에러', detail: String(e) });
  }
});

module.exports = router;