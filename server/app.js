// server/app.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const helmet = require('helmet');

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

// 보안 헤더 설정
app.use(helmet({
  crossOriginEmbedderPolicy: false, // 임베드된 리소스 허용
  contentSecurityPolicy: false, // CSP 비활성화 (필요에 따라 설정)
}));

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
const adminCounselRoutes = require('./routes/adminCounselRoutes');
const adminPopupBannerRoutes = require('./routes/adminPopupBannerRoutes');
const superSettingsRoutes = require('./routes/superSettingsRoutes');
const siteContentRoutes = require('./routes/siteContentRoutes');
const themeUpload = require('./routes/themeUpload');
const teacherProfileRoutes = require('./routes/teacherProfileRoutes');

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
app.use('/api/admin/popup-banners', adminPopupBannerRoutes);
app.use('/api/admin', adminLessonRoutes);
app.use('/api/admin/class-types', adminClassTypeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/class-groups', classGroupRoutes);
app.use('/api/admin/counsel', staffCounselRoutes);
app.use(reportRoutes); // includes /api/reports/public, /r/:code
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminCounselRoutes);
app.use('/api/super', superSettingsRoutes); // GET/POST /api/super/site-settings

// 학교/학사일정 (신식+별칭 모두 유지)
app.use('/api/schools', schoolRoutes);
app.use('/api/school', schoolRoutes); // 구식 별칭도 허용
app.use('/api/school-periods', schoolPeriodRoutes);
app.use('/api/schools/periods', schoolPeriodRoutes);

// (신규) 관리자/슈퍼용: 크론 설정/수동 실행
app.use('/api/super', superCronRoutes);

// 강사 프로필 관리
app.use('/api/teacher-profiles', teacherProfileRoutes);

// 사이트 설정 및 테마 업로드 (더 구체적인 경로부터 먼저)
app.use('/api/content', siteContentRoutes);
app.use('/api/theme', themeUpload);
app.use('/api/banner', bannerUpload);

// 퍼블릭 사이트 설정
app.use('/api/public-site-settings', publicSiteSettingsRoutes);
// ⬇️ 프론트가 쓰는 구 경로를 별칭으로 추가 (이번 404의 원인 해결)
app.use('/api/site/public-settings', publicSiteSettingsRoutes);
app.use('/api/site', publicSiteSettingsRoutes); // GET /api/site/public

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

// SQLite/PostgreSQL 연결 테스트 (있는 경우)
const sequelize = require('./db');
if (sequelize) {
  sequelize.authenticate()
    .then(() => {
      console.log('[Sequelize] Database connection established successfully');
      return sequelize.sync();
    })
    .then(() => {
      console.log('[Sequelize] Database synchronized');
    })
    .catch(err => {
      console.error('[Sequelize] Unable to connect to database:', err.message);
      if (process.env.NODE_ENV === 'production') {
        console.warn('[Sequelize] Continuing without SQL database (MongoDB only)');
      }
    });
}

mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(async () => {
    console.log('[MongoDB] connected:', MONGO_URI.replace(/:\/\/.*@/, '://****@'));

    await seedFromEnvIfEmpty(Setting, process.env);

    const s = await getSettings(Setting, { useCache: false });
    // 실제 비즈니스 로직 어댑터 생성 - superCronRoutes와 동일한 로직 사용
    const buildServicesAdapter = () => {
      const superCronModule = require('./routes/superCronRoutes');
      // superCronRoutes에서 buildServicesAdapter 함수를 추출
      // 임시로 require한 모듈에서 함수를 가져오기 위해 코드를 직접 실행
      const moment = require('moment-timezone');
      const Attendance = require('./models/Attendance');
      const User = require('./models/User');
      const LessonLog = require('./models/LessonLog');
      const { sendAlimtalk } = require('./utils/alimtalk');
      const { sendReportAlimtalk } = require('./utils/alimtalkReport');

      return {
        // 자동하원 미리보기 - 등원했지만 하원하지 않은 학생들 조회
        previewAutoLeave: async ({ limit = 500 }) => {
          const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');
          const checkIns = await Attendance.find({
            date: today,
            type: 'IN'
          }).populate('userId', 'name parentPhone').lean();

          const list = [];
          for (const checkIn of checkIns.slice(0, limit)) {
            const checkOut = await Attendance.findOne({
              userId: checkIn.userId._id,
              date: today,
              type: 'OUT'
            }).lean();

            if (!checkOut) {
              list.push({
                studentId: checkIn.userId._id,
                studentName: checkIn.userId.name,
                parentPhone: checkIn.userId.parentPhone,
                checkInTime: checkIn.time,
                date: today
              });
            }
          }
          return { list, count: list.length };
        },

        // 자동하원 실행 - 실제로 하원 처리
        performAutoLeave: async ({ limit = 500 }) => {
          const now = moment().tz('Asia/Seoul');
          const today = now.format('YYYY-MM-DD');
          const currentTime = now.format('HH:mm:ss');

          // 먼저 미리보기로 대상자 확인
          const services = buildServicesAdapter();
          const { list } = await services.previewAutoLeave({ limit });

          const processed = [];
          for (const student of list) {
            try {
              await Attendance.create({
                userId: student.studentId,
                date: today,
                type: 'OUT',
                time: currentTime,
                auto: true,
                notified: false
              });

              await sendAlimtalk(student.parentPhone, 'UB_0082', {
                name: student.studentName,
                type: '하원',
                time: now.format('HH:mm'),
                automsg: '(자동 하원 처리)'
              });

              processed.push({
                studentName: student.studentName,
                checkInTime: student.checkInTime,
                autoCheckOutTime: currentTime
              });
            } catch (error) {
              console.error(`자동 하원 처리 실패 - ${student.studentName}:`, error);
            }
          }
          return { processed: processed.length, preview: processed };
        },

        // 일일 리포트 미리보기
        previewDailyReport: async ({ limit = 500 }) => {
          // 전날 작성된 리포트를 다음날 아침에 발송
          const yesterday = moment().tz('Asia/Seoul').subtract(1, 'day').format('YYYY-MM-DD');
          const reports = await LessonLog.find({
            date: yesterday,
            notifyStatus: '대기'
          })
          .populate('studentId', 'name parentPhone')
          .limit(limit)
          .lean();

          const list = reports.map(report => ({
            logId: report._id,
            studentId: report.studentId._id,
            studentName: report.studentId.name,
            parentPhone: report.studentId.parentPhone,
            course: report.course,
            content: report.content,
            homework: report.homework,
            date: report.date,
            scheduledAt: report.scheduledAt
          }));

          return { list, count: list.length };
        },

        // 일일 리포트 실행
        performDailyReport: async ({ limit = 500 }) => {
          const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';
          const services = buildServicesAdapter();
          const { list } = await services.previewDailyReport({ limit });

          const processed = [];
          for (const report of list) {
            try {
              const reportUrl = `${REPORT_BASE}/r/${report.logId}`;

              await sendReportAlimtalk(report.parentPhone, {
                studentName: report.studentName,
                course: report.course,
                content: report.content,
                homework: report.homework,
                reportUrl: reportUrl,
                date: report.date
              });

              await LessonLog.findByIdAndUpdate(report.logId, {
                notifyStatus: '발송',
                notifyLog: `자동발송 완료 - ${moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')}`
              });

              processed.push({
                studentName: report.studentName,
                course: report.course,
                reportUrl: reportUrl
              });
            } catch (error) {
              console.error(`리포트 발송 실패 - ${report.studentName}:`, error);
              await LessonLog.findByIdAndUpdate(report.logId, {
                notifyStatus: '실패',
                notifyLog: `자동발송 실패 - ${error.message}`
              });
            }
          }
          return { processed: processed.length, preview: processed };
        }
      };
    };

    const Services = buildServicesAdapter();

    cron.schedule(s.autoLeaveCron, async () => {
      try {
        const current = await getSettings(Setting);
        if (!current.autoLeaveEnabled) return;
        console.log('[cron:autoLeave] 자동하원 작업 시작');
        const result = await runAutoLeave({ Setting, Services });
        console.log('[cron:autoLeave] 완료:', result);
      } catch (e) { console.error('[cron:autoLeave]', e); }
    }, { timezone: s.timezone || 'Asia/Seoul' });

    cron.schedule(s.autoReportCron, async () => {
      try {
        const current = await getSettings(Setting);
        if (!current.autoReportEnabled) return;
        console.log('[cron:dailyReport] 일일리포트 발송 작업 시작');
        const result = await runDailyReport({ Setting, Services });
        console.log('[cron:dailyReport] 완료:', result);
      } catch (e) { console.error('[cron:dailyReport]', e); }
    }, { timezone: s.timezone || 'Asia/Seoul' });

    console.log('[cron] scheduled from DB settings');

    // 전역 에러 핸들러
    app.use((err, req, res, next) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Global Error Handler]', err);
      }

      // 클라이언트에게 상세한 에러 정보를 보내지 않음
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
          ? '서버 내부 오류가 발생했습니다.'
          : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });

    // 404 핸들러
    app.use((req, res) => {
      res.status(404).json({
        error: '요청하신 리소스를 찾을 수 없습니다.',
        path: req.originalUrl
      });
    });

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
