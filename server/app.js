// server/app.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;

/* =========================
 * CORS 설정
 * ========================= */
function isDevOrigin(origin) {
  if (!origin) return true; // same-origin/server call
  try {
    const u = new URL(origin);
    const host = u.hostname;
    const port = u.port;
    if (host === 'localhost' && port === '3000') return true;
    if (host === '127.0.0.1' && port === '3000') return true;
    if (/^192\.168\.\d+\.\d+$/.test(host) && port === '3000') return true;
  } catch (_) {}
  return false;
}

const envAllowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptionsDelegate = (req, cb) => {
  const origin = req.header('Origin');
  if (!origin) return cb(null, { origin: true, credentials: true }); // same-origin
  if (envAllowed.includes(origin) || isDevOrigin(origin)) {
    return cb(null, {
      origin: true,
      credentials: true,
      methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization'],
      optionsSuccessStatus: 204,
    });
  }
  return cb(null, { origin: false });
};

app.use(cors(corsOptionsDelegate));
// 프리플라이트 보장
app.options(/.*/, cors(corsOptionsDelegate));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
 * DB 연결
 * 우선순위: MONGO_URL → MONGODB_URI → MONGO_URI → 기본값
 * ========================= */
const MONGO_URI =
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/math-academy?directConnection=true';

mongoose.set('strictQuery', false);

/* =========================
 * A안: DB Settings 기반 크론 구성
 * ========================= */
const Setting = require('./models/Setting');
const { seedFromEnvIfEmpty, getSettings } = require('./services/cron/settingsService');
const { runAutoLeave } = require('./services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('./services/cron/jobs/dailyReportJob');
const superCronRoutes = require('./routes/superCronRoutes');
const Services = require('./services/cron/servicesAdapter');

/* =========================
 * 라우트 import (기존 유지)
 * ========================= */
const authRoutes                 = require('./routes/authRoutes');
const subjectRoutes              = require('./routes/subjectRoutes');
const chapterRoutes              = require('./routes/chapterRoutes');
const assignmentRoutes           = require('./routes/assignmentRoutes');
const userRoutes                 = require('./routes/userRoutes');
const newsRoutes                 = require('./routes/newsRoutes');
const materialRoutes             = require('./routes/materialRoutes');
const contactRoutes              = require('./routes/contactRoutes');
const blogRoutes                 = require('./routes/blogRoutes');
const settingsRoutes             = require('./routes/settingsRoutes');
const adminUserRoutes            = require('./routes/adminUserRoutes');
const adminProfileRoutes         = require('./routes/adminProfileRoutes');
const adminLessonRoutes          = require('./routes/adminLessonRoutes');
const adminClassTypeRoutes       = require('./routes/adminClassTypeRoutes');
const attendanceRoutes           = require('./routes/attendanceRoutes');
const classGroupRoutes           = require('./routes/classGroupRoutes');
const staffCounselRoutes         = require('./routes/adminCounselRoutes');
const reportRoutes               = require('./routes/reportRoutes');
const progressRoutes             = require('./routes/progressRoutes');
const schoolRoutes               = require('./routes/schoolRoutes');
const schoolPeriodRoutes         = require('./routes/schoolPeriodRoutes');
const publicSiteSettingsRoutes   = require('./routes/publicSiteSettingsRoutes');
const bannerUpload               = require('./routes/bannerUpload');

/* =========================
 * 라우트 마운트
 * ========================= */
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin', adminLessonRoutes);
app.use('/api/admin/class-types', adminClassTypeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/class-groups', classGroupRoutes);
app.use('/api/admin/counsel', staffCounselRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/progress', progressRoutes);

// 학교/학사일정 (신식+별칭 모두 유지)
app.use('/api/schools', schoolRoutes);
app.use('/api/school', schoolRoutes); // 구식 별칭도 허용
app.use('/api/school-periods', schoolPeriodRoutes);
app.use('/api/schools/periods', schoolPeriodRoutes);

// 퍼블릭 사이트 설정
app.use('/api/public-site-settings', publicSiteSettingsRoutes);
// ⬇️ 프론트가 쓰는 구 경로를 별칭으로 추가 (이번 404의 원인 해결)
app.use('/api/site/public-settings', publicSiteSettingsRoutes);

// (신규) 관리자/슈퍼용: 크론 설정/수동 실행
app.use('/api/super', superCronRoutes);

// 업로드(정적)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
 * 헬스체크
 * ========================= */
app.get('/healthz', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

/* =========================
 * 에러 핸들러(최후)
 * ========================= */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ message: err.message || '서버 오류' });
});

/* =========================
 * 서버 시작: DB 연결 후 크론 스케줄 등록
 * ========================= */
mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(async () => {
    console.log('[MongoDB] connected:', MONGO_URI.replace(/:\/\/.*@/, '://****@'));

    await seedFromEnvIfEmpty(Setting, process.env);

    const s = await getSettings(Setting, { useCache: false });
    cron.schedule(s.autoLeaveCron, async () => {
      try {
        const current = await getSettings(Setting);
        if (!current.autoLeaveEnabled) return;
        await runAutoLeave({ Setting, Services });
      } catch (e) { console.error('[cron:autoLeave]', e); }
    }, { timezone: s.timezone || 'Asia/Seoul' });

    cron.schedule(s.autoReportCron, async () => {
      try {
        const current = await getSettings(Setting);
        if (!current.autoReportEnabled) return;
        await runDailyReport({ Setting, Services });
      } catch (e) { console.error('[cron:dailyReport]', e); }
    }, { timezone: s.timezone || 'Asia/Seoul' });

    console.log('[cron] scheduled from DB settings');

    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
      console.log(`[CORS] allowed (env):`, envAllowed);
      console.log(`[CORS] dev origins: localhost:3000, 127.0.0.1:3000, 192.168.*:3000`);
      console.log(`[Mount] schools: /api/school + /api/schools`);
      console.log(`[Mount] school-periods: /api/school-periods + /api/schools/periods`);
      console.log(`[Alias] public settings: /api/public-site-settings + /api/site/public-settings`);
    });
  })
  .catch(err => {
    console.error('[MongoDB] 연결 실패:', err);
    process.exit(1);
  });
