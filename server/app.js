// server/app.js
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;

/* =========================
 * CORS 설정 (다중 오리진 + 로컬/LAN 허용)
 * ========================= */
function isDevOrigin(origin) {
  if (!origin) return true; // 같은 오리진/서버 호출
  try {
    const u = new URL(origin);
    const host = u.hostname;
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');

    // localhost/127.0.0.1:3000 허용
    if ((host === 'localhost' || host === '127.0.0.1') && port === '3000') return true;

    // 192.168.x.x:3000 같은 사설망 개발 오리진 허용
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) && port === '3000') return true;

    return false;
  } catch {
    return false;
  }
}

const envAllowed = (process.env.CORS_ORIGINS || 'https://ig-math-2022.onrender.com')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (isDevOrigin(origin)) return callback(null, true);
    if (!origin) return callback(null, true); // 서버 내부/헬스체크 등
    if (envAllowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
 * 헬퍼: Router 보장
 * ========================= */
function ensureRouter(router, name) {
  const express_ = require('express');
  if (typeof router === 'function' && router.name === 'router') return router;
  if (router && router.stack && Array.isArray(router.stack)) return router;
  console.warn(`[WARN] ${name} is not an Express.Router. Wrapping with dummy handler.`);
  const r = express_.Router();
  r.use((req, res) => res.status(500).json({ message: `Router(${name}) misconfigured` }));
  return r;
}

/* =========================
 * Mongo 연결
 * ========================= */
const MONGO_URL = process.env.MONGO_URL;
mongoose.connect(MONGO_URL, { autoIndex: true })
  .then(async () => {
    console.log('MongoDB Connected!');

    /* =========================
     * 라우트 import
     * ========================= */
    const authRoutes            = require('./routes/authRoutes');
    const subjectRoutes         = require('./routes/subjectRoutes');
    const chapterRoutes         = require('./routes/chapterRoutes');
    const assignmentRoutes      = require('./routes/assignmentRoutes');
    const userRoutes            = require('./routes/userRoutes');
    const newsRoutes            = require('./routes/newsRoutes');
    const materialRoutes        = require('./routes/materialRoutes');
    const contactRoutes         = require('./routes/contactRoutes');
    const blogRoutes            = require('./routes/blogRoutes');
    const settingsRoutes        = require('./routes/settingsRoutes');
    const studentProgressRoutes = require('./routes/studentProgressRoutes');
    const progressRoutes        = require('./routes/progressRoutes');
    const publicSiteSettingsRoutes = require('./routes/publicSiteSettingsRoutes');

    const attendanceRoutes      = require('./routes/attendanceRoutes');
    const bannerUploadRoutes    = require('./routes/bannerUpload');
    const adminLessonRoutes     = require('./routes/adminLessonRoutes');    // /api/admin/*
    const reportRoutes          = require('./routes/reportRoutes');         // /report, /r/:code
    const classGroupRoutes      = require('./routes/classGroupRoutes');     // 수업반
    const staffLessonRoutes     = require('./routes/staffLessonRoutes');    // 스태프(강사)
    const superSettingsRoutes   = require('./routes/superSettingsRoutes');
    const adminUserRoutes       = require('./routes/adminUserRoutes');
    const staffCounselRoutes    = require('./routes/staffCounselRoutes');
    const adminClassTypeRoutes  = require('./routes/adminClassTypeRoutes'); // 수업형태

    // 학교/기간 라우트
    const schoolRoutes          = require('./routes/schoolRoutes');
    const schoolPeriodRoutes    = require('./routes/schoolPeriodRoutes');

    /* =========================
     * 정적/공용
     * ========================= */
    app.use('/uploads', express.static('uploads'));

    /* =========================
     * 인증/기본 리소스
     * ========================= */
    app.use('/api/auth',           ensureRouter(authRoutes, 'authRoutes'));
    app.use('/api/subjects',       ensureRouter(subjectRoutes, 'subjectRoutes'));
    app.use('/api/chapters',       ensureRouter(chapterRoutes, 'chapterRoutes'));
    app.use('/api/assignments',    ensureRouter(assignmentRoutes, 'assignmentRoutes'));
    app.use('/api/users',          ensureRouter(userRoutes, 'userRoutes'));
    app.use('/api/news',           ensureRouter(newsRoutes, 'newsRoutes'));
    app.use('/api/materials',      ensureRouter(materialRoutes, 'materialRoutes'));
    app.use('/api/contact',        ensureRouter(contactRoutes, 'contactRoutes'));
    app.use('/api/blog',           ensureRouter(blogRoutes, 'blogRoutes'));
    app.use('/api/settings',       ensureRouter(settingsRoutes, 'settingsRoutes'));
    // progress 라우트가 두 개면 둘 다 Router 여야 함
    app.use('/api/progress',       ensureRouter(studentProgressRoutes, 'studentProgressRoutes'));
    app.use('/api/progress',       ensureRouter(progressRoutes, 'progressRoutes'));

    /* =========================
     * 공개 사이트 설정/리포트
     * ========================= */
    app.use('/api/site',           ensureRouter(publicSiteSettingsRoutes, 'publicSiteSettingsRoutes'));
    app.use('/',                   ensureRouter(reportRoutes, 'reportRoutes')); // /report, /r/:code

    /* =========================
     * 관리자/슈퍼/스태프
     * ========================= */
    app.use('/api/admin',          ensureRouter(adminLessonRoutes, 'adminLessonRoutes'));        // /api/admin/lessons/*
    app.use('/api/admin',          ensureRouter(adminUserRoutes, 'adminUserRoutes'));            // /api/admin/users*
    app.use('/api/admin',          ensureRouter(adminClassTypeRoutes, 'adminClassTypeRoutes'));  // /api/admin/class-types*
    app.use('/api/staff',          ensureRouter(staffLessonRoutes, 'staffLessonRoutes'));        // /api/staff/lessons*, alerts, metrics...
    app.use('/api/super',          ensureRouter(superSettingsRoutes, 'superSettingsRoutes'));    // /api/super/*

    // 상담 라우트
    app.use('/api/staff',          ensureRouter(staffCounselRoutes, 'staffCounselRoutes'));      // /api/staff/counsel

    // 학교/학교기간 마운트 (단수/복수 모두 허용 → 프론트 기존 요청과 호환)
    app.use('/api/school',         ensureRouter(schoolRoutes, 'schoolRoutes'));                  // 단수
    app.use('/api/schools',        ensureRouter(schoolRoutes, 'schoolRoutes'));                  // 복수(별칭)
    app.use('/api/school-periods', ensureRouter(schoolPeriodRoutes, 'schoolPeriodRoutes'));      // 기존
    app.use('/api/schools/periods',ensureRouter(schoolPeriodRoutes, 'schoolPeriodRoutes'));      // 복수 경로 별칭

    /* =========================
     * 출결/그 외(필요 시)
     * ========================= */
    app.use('/api/attendance',     ensureRouter(attendanceRoutes, 'attendanceRoutes'));
    app.use('/api/banner',         ensureRouter(bannerUploadRoutes, 'bannerUploadRoutes'));
    app.use('/api/class-groups',   ensureRouter(classGroupRoutes, 'classGroupRoutes'));

    /* =========================
     * 헬스체크
     * ========================= */
    app.get('/healthz', (_req, res) => res.json({ ok: true }));

    /* =========================
     * CRON (옵션)
     * ========================= */
    const CRON_ENABLED_AUTO_LEAVE = String(process.env.CRON_ENABLED_AUTO_LEAVE || '0') === '1';
    const AUTO_LEAVE_CRON         = process.env.AUTO_LEAVE_CRON || '30 22 * * *';
    const DAILY_REPORT_AUTO       = String(process.env.DAILY_REPORT_AUTO || '0') === '1';
    const DAILY_REPORT_CRON       = process.env.DAILY_REPORT_CRON || '30 10 * * *';

    if (CRON_ENABLED_AUTO_LEAVE) {
      cron.schedule(AUTO_LEAVE_CRON, async () => {
        try {
          const url = `${process.env.SELF_BASE_URL}/api/admin/lessons/auto-leave`;
          await axios.post(url, {}, { timeout: 15000 });
          console.log('[CRON] auto-leave executed');
        } catch (e) { console.error('[CRON] auto-leave failed', e?.message || e); }
      });
    }
    if (DAILY_REPORT_AUTO) {
      cron.schedule(DAILY_REPORT_CRON, async () => {
        try {
          const url = `${process.env.SELF_BASE_URL}/api/admin/lessons/send-daily`;
          await axios.post(url, {}, { timeout: 15000 });
          console.log('[CRON] daily-report executed');
        } catch (e) { console.error('[CRON] daily-report failed', e?.message || e); }
      });
    }

    /* =========================
     * 서버 시작
     * ========================= */
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
      console.log(`[CORS] allowed (env):`, envAllowed);
      console.log(`[CORS] dev origins: localhost:3000, 127.0.0.1:3000, 192.168.*:3000`);
      console.log(`[Mount] schools: /api/school + /api/schools`);
      console.log(`[Mount] school-periods: /api/school-periods + /api/schools/periods`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
  });
