
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: 임시로 로컬 uploads/ 에 저장한 뒤 R2로 업로드
const upload = multer({ dest: 'uploads/' });

// Cloudflare R2 연결 설정 (AWS SDK v2 사용)
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4'
});

function parseAccountIdFromEndpoint(endpoint) {
  if (!endpoint) return '';
  try {
    const host = new URL(endpoint).hostname;
    const match = host.match(/^([^.]+)\.r2\.cloudflarestorage\.com$/i);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

function buildPublicUrl({ keyName, uploadResult }) {
  const baseRaw = (process.env.REACT_APP_R2_PUBLIC_URL || '').trim();
  if (baseRaw) {
    let base = baseRaw.replace(/\/+$/, '');
    try {
      const host = new URL(base).hostname;
      const accountFromBase = parseAccountIdFromEndpoint(`https://${host}`);
      if (accountFromBase && /\.r2\.cloudflarestorage\.com$/i.test(host)) {
        base = `https://pub-${accountFromBase}.r2.dev`;
      }
    } catch (_) {
      /* ignore invalid URL */
    }

    const bucket = (process.env.R2_BUCKET || '').trim().replace(/\/+$/, '');
    if (bucket && !base.toLowerCase().endsWith(`/${bucket}`.toLowerCase())) {
      base = `${base}/${bucket}`;
    }
    return `${base}/${keyName}`;
  }

  const accountId = process.env.R2_ACCOUNT_ID || parseAccountIdFromEndpoint(process.env.R2_ENDPOINT || '');
  const bucket = process.env.R2_BUCKET;
  if (accountId && bucket) {
    return `https://pub-${accountId}.r2.dev/${bucket}/${keyName}`;
  }

  if (uploadResult && uploadResult.Location) {
    return uploadResult.Location;
  }

  return keyName;
}

// 배너 이미지 업로드
router.post('/upload', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: '파일이 없습니다.' });
    }

    // 파일명 깨짐 방지 및 확장자 유지
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName) || '';
    const keyName = `banners/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const fileStream = fs.createReadStream(file.path);

    const uploadResult = await s3.upload({
      Bucket: process.env.R2_BUCKET,
      Key: keyName,
      Body: fileStream,
      ContentType: file.mimetype,
    }).promise();

    // 업로드 후 로컬 임시 파일 제거
    fs.unlinkSync(file.path);

    const publicUrl = buildPublicUrl({ keyName, uploadResult });
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[배너 업로드 에러]', err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('[임시 파일 삭제 에러]', unlinkErr);
      }
    }
    res.status(500).json({ message: '배너 업로드 실패', error: String(err.message || err) });
  }
});

module.exports = router;
