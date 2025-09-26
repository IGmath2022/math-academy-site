const express = require('express');
const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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

function extractKeyFromUrl(input, type) {
  const direct = normalizeLogoKey(input);
  if (direct) {
    return direct;
  }

  if (!input) return '';

  const bucket = (process.env.R2_BUCKET || '').trim();
  const trimmed = String(input).trim();
  if (!trimmed) return '';

  const stripLeadingSlash = (value) => value.replace(/^\/+/, '');

  const tryNormalize = (value) => {
    if (!value) return '';
    let normalized = stripLeadingSlash(value);
    if (!normalized) return '';
    let segments = normalized.split('/').filter(Boolean);
    if (bucket && segments.length && segments[0].toLowerCase() === bucket.toLowerCase()) {
      segments = segments.slice(1);
    }
    normalized = segments.join('/');
    return normalizeLogoKey(normalized);
  };

  try {
    if (PUBLIC_BASE) {
      const normalizedBase = PUBLIC_BASE.replace(/\/+$/, '');
      if (trimmed.startsWith(normalizedBase)) {
        const relative = tryNormalize(trimmed.slice(normalizedBase.length));
        if (relative) return relative;
      }
    }

    if (/^https?:/i.test(trimmed)) {
      const parsed = new URL(trimmed);
      const relative = tryNormalize(parsed.pathname || '');
      if (relative) return relative;
    }
  } catch {
    // ignore parsing errors
  }

  return tryNormalize(trimmed);
}

function buildPublicUrl(keyName) {
  return PUBLIC_BASE ? `${PUBLIC_BASE}/${keyName}` : keyName;
}

function normalizeLogoKey(raw) {
  if (!raw) return '';

  let value = String(raw).trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    value = parsed.pathname || '';
  } catch {
    // raw value is not a full URL
  }

  value = (value.split(/[?#]/)[0] || '').replace(/\\/g, '/');
  value = value.replace(/^\/+/, '');

  const bucket = (process.env.R2_BUCKET || '').trim();
  if (bucket) {
    const loweredBucket = bucket.toLowerCase();
    if (value.toLowerCase().startsWith(`${loweredBucket}/`)) {
      value = value.slice(bucket.length + 1);
    }
  }

  value = value.replace(/^\/+/, '');

  const segments = value.split('/').filter(Boolean);
  if (!segments.length) return '';

  const themeIndex = segments.findIndex((segment) => segment.toLowerCase() === 'theme');
  if (themeIndex !== -1) {
    return segments.slice(themeIndex).join('/');
  }

  return segments.join('/');
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

// 로고 삭제 (자료실 방식과 동일하게 간소화)
router.post('/delete/logo', isAuthenticated, requireSuper, async (req, res) => {
  try {
    const { url, type } = req.body || {};
    const allowed = new Set(['header', 'favicon', 'loading', 'hero']);

    if (type && !allowed.has(type)) {
      return res.status(400).json({ message: '삭제할 수 없는 로고 타입입니다.' });
    }

    if (!url) {
      return res.status(400).json({ message: '삭제할 파일 URL이 필요합니다.' });
    }

    console.log(`[로고 삭제 시작] URL: ${url}, 타입: ${type}`);
    console.log(`[로고 삭제] PUBLIC_BASE: ${PUBLIC_BASE}`);

    // URL에서 간단하게 키 추출
    let objectKey = '';
    try {
      if (PUBLIC_BASE && url.startsWith(PUBLIC_BASE)) {
        // PUBLIC_BASE가 있고 URL이 해당 베이스로 시작하는 경우
        objectKey = url.slice(PUBLIC_BASE.length + 1);
        console.log(`[로고 삭제] PUBLIC_BASE 방식으로 키 추출: ${objectKey}`);
      } else if (url.startsWith('http')) {
        // 전체 URL인 경우 pathname 사용
        const urlObj = new URL(url);
        objectKey = urlObj.pathname.slice(1); // 맨 앞의 '/' 제거
        console.log(`[로고 삭제] HTTP URL 방식으로 키 추출: ${objectKey}`);
      } else {
        // 이미 키 형태인 경우
        objectKey = url.startsWith('/') ? url.slice(1) : url;
        console.log(`[로고 삭제] 직접 키 방식: ${objectKey}`);
      }

      // 버킷명이 키에 포함되어 있으면 제거
      const bucket = process.env.R2_BUCKET;
      if (bucket && objectKey.startsWith(`${bucket}/`)) {
        const originalKey = objectKey;
        objectKey = objectKey.slice(bucket.length + 1);
        console.log(`[로고 삭제] 버킷명 제거: ${originalKey} -> ${objectKey}`);
      }
    } catch (parseErr) {
      console.error('[로고 삭제] URL 파싱 실패:', parseErr);
      return res.status(400).json({ message: '올바르지 않은 URL 형식입니다.' });
    }

    if (!objectKey) {
      return res.status(400).json({ message: '삭제할 파일 경로를 찾을 수 없습니다.' });
    }

    // R2에서 파일 삭제 (AWS SDK v3 방식)
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
      }));

      console.log(`[로고 삭제 성공] 키: ${objectKey}`);
    } catch (deleteErr) {
      console.warn('[로고 삭제] R2 삭제 실패:', deleteErr);
      // 파일이 이미 없어도 성공으로 처리 (404 에러 무시)
      if (deleteErr.name !== 'NoSuchKey' && deleteErr.$metadata?.httpStatusCode !== 404) {
        throw deleteErr;
      }
    }

    return res.json({ ok: true, key: objectKey, type: type || 'unknown' });
  } catch (err) {
    console.error('[로고 삭제 오류]', err);
    return res.status(500).json({ message: '로고 삭제에 실패했습니다.', error: String(err?.message || err) });
  }
});

module.exports = router;
