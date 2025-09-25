const express = require('express');
const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Cloudflare R2 설정
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function parseAccountIdFromEndpoint(endpoint) {
  if (!endpoint) return '';
  try {
    const host = new URL(endpoint).hostname;
    const match = host.match(/^([^.]+)\.r2\.cloudflarestorage\.com$/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function resolvePublicBase() {
  const raw = (process.env.REACT_APP_R2_PUBLIC_URL || '').trim();
  if (raw) {
    let base = raw.replace(/\/+$/, '');
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
    } catch {
      /* ignore invalid base */
    }
    return base;
  }

  const accountId = process.env.R2_ACCOUNT_ID || parseAccountIdFromEndpoint(process.env.R2_ENDPOINT || '');
  const bucket = process.env.R2_BUCKET;
  if (accountId && bucket) {
    return `https://pub-${accountId}.r2.dev/${bucket}`.replace(/\/+$/, '');
  }
  return '';
}

const PUBLIC_BASE = resolvePublicBase();

function buildPublicUrl(keyName) {
  return PUBLIC_BASE ? `${PUBLIC_BASE}/${keyName}` : keyName;
}

function decodeFilename(name) {
  if (!name) return 'file';
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

function makeObjectKey(prefix, originalName) {
  const decoded = decodeFilename(originalName);
  const ext = path.extname(decoded) || '';
  return `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
}

function sanitizeSegment(value, fallback = 'general') {
  const normalized = String(value || fallback || 'general').trim();
  return normalized ? normalized.replace(/[^a-zA-Z0-9_-]+/g, '-') || fallback : fallback;
}

function requireSuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role !== 'super') {
    return res.status(403).json({ message: 'Super admin only' });
  }
  return next();
}

// 로고 업로드 (헤더, 파비콘, 로딩, 히어로)
router.post('/upload/logo', isAuthenticated, requireSuper, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body; // 'header', 'favicon', 'loading', 'hero'

    const allowed = new Set(['header', 'favicon', 'loading', 'hero']);

    if (!file) return res.status(400).json({ message: '파일 없음' });
    if (!allowed.has(type)) {
      return res.status(400).json({ message: '허용되지 않은 로고 타입입니다.' });
    }

    const key = makeObjectKey(`theme/logos/${type}`, file.originalname);
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));
    const publicUrl = buildPublicUrl(key);

    res.json({ url: publicUrl, type });
  } catch (err) {
    console.error('[로고 업로드 오류]', err);
    res.status(500).json({ message: '로고 업로드에 실패했습니다.', error: String(err?.message || err) });
  }
});

// 강사 사진 업로드
router.post('/upload/teacher', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: '파일 없음' });

    const key = makeObjectKey('theme/teachers', file.originalname);
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));
    const publicUrl = buildPublicUrl(key);

    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[강사 사진 업로드 오류]', err);
    res.status(500).json({ message: '강사 사진 업로드에 실패했습니다.', error: String(err?.message || err) });
  }
});

// 갤러리 이미지 업로드
router.post('/upload/gallery', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { category } = req.body; // 'facility', 'class', 'event'

    if (!file) return res.status(400).json({ message: '파일 없음' });

    const safeCategory = sanitizeSegment(category, 'general');
    const key = makeObjectKey(`theme/gallery/${safeCategory}`, file.originalname);
    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));
    const publicUrl = buildPublicUrl(key);

    res.json({ url: publicUrl, category: safeCategory });
  } catch (err) {
    console.error('[갤러리 업로드 오류]', err);
    res.status(500).json({ message: '갤러리 업로드에 실패했습니다.', error: String(err?.message || err) });
  }
});

module.exports = router;
