const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const upload = multer({ storage: multer.memoryStorage() });

// 네이버 오브젝트스토리지 S3Client 설정
const s3 = new S3Client({
  region: 'kr-standard',
  endpoint: process.env.NAVER_ENDPOINT, // 예: https://kr.object.ncloudstorage.com
  credentials: {
    accessKeyId: process.env.NAVER_ACCESS_KEY,
    secretAccessKey: process.env.NAVER_SECRET_KEY,
  },
});

// 파일 업로드 API (학원별 폴더/용량 제한)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
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
      ACL: 'public-read', // 공개 권한(자료실 등)
      //ServerSideEncryption: 'AES256' // 이 한 줄! (필요하면)
    };
    await s3.send(new PutObjectCommand(params));

    // 3. 업로드 파일 URL 생성 (네이버 공식 형식)
    // https://{버킷명}.kr.object.ncloudstorage.com/{key}
    const bucket = process.env.NAVER_BUCKET;
    const url = `https://${bucket}.kr.object.ncloudstorage.com/${key}`;

    res.json({ url, filename: file.originalname });
  } catch (e) {
    console.error('[파일 업로드 에러]', e);
    res.status(500).json({ message: '파일 업로드 중 서버 에러', detail: String(e) });
  }
});

module.exports = router;