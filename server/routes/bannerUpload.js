
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: ?�시�?로컬 uploads/ ???�?�한 ??R2�??�로??
const upload = multer({ dest: 'uploads/' });

// Cloudflare R2 ?�결 ?�정 (AWS SDK v2 ?�용)
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
      const parsed = new URL(base);
      let host = parsed.hostname;
      const accountFromBase = parseAccountIdFromEndpoint(`https://${host}`);
      if (accountFromBase && /\.r2\.cloudflarestorage\.com$/i.test(host)) {
        host = `pub-${accountFromBase}.r2.dev`;
      }
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const normalizedPath = pathSegments.length ? `/${pathSegments.join('/')}` : '';
      base = `${parsed.protocol}//${host}${normalizedPath}`.replace(/\/+$/, '');
    } catch (_) {
      /* ignore invalid base */
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
// 배너 ?��?지 ?�로??
router.post('/upload', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: '?�일???�습?�다.' });
    }

    // ?�일�?깨짐 방�? �??�장???��?
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

    // ?�로????로컬 ?�시 ?�일 ?�거
    fs.unlinkSync(file.path);

    const publicUrl = buildPublicUrl({ keyName, uploadResult });
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[배너 ?�로???�러]', err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('[?�시 ?�일 ??�� ?�러]', unlinkErr);
      }
    }
    res.status(500).json({ message: '배너 ?�로???�패', error: String(err.message || err) });
  }
});

module.exports = router;

