const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: 파일을 임시로 로컬에 저장 (자료실과 동일한 방식)
const upload = multer({ dest: 'uploads/' });

// Cloudflare R2 연결 설정 (자료실과 동일한 방식 - AWS SDK v2)
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4'
});

// 배너 이미지 업로드
router.post('/upload', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "파일이 없습니다." });
    }

    // 한글 파일명 깨짐 방지 (자료실과 동일)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // R2 버킷 업로드 Key (배너 전용 폴더)
    const keyName = `banners/${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const fileStream = fs.createReadStream(file.path);

    const uploadResult = await s3.upload({
      Bucket: process.env.R2_BUCKET,
      Key: keyName,
      Body: fileStream,
      ContentType: file.mimetype,
      // public-read 대신 ACL 제거 (R2에서 문제가 될 수 있음)
    }).promise();

    // 업로드 후 로컬 임시 파일 삭제
    fs.unlinkSync(file.path);

    // public URL 반환
    const publicUrl = `${process.env.REACT_APP_R2_PUBLIC_URL}/${keyName}`;
    res.json({ url: publicUrl });
  } catch (err) {
    console.error("[배너 업로드 에러]", err);
    // 에러 발생 시 임시 파일이 남아있으면 삭제
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("[임시 파일 삭제 에러]", unlinkErr);
      }
    }
    res.status(500).json({ message: "배너 업로드 실패", error: String(err.message || err) });
  }
});

module.exports = router;