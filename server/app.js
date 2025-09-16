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
 * CORS 설정 (다중 오리진)
 * ========================= */
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://ig-math-2022.onrender.com')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // 서버-서버 호출 등
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

/* =========================
 * 운영용 외부 IP 확인
 * ========================= */
app.get('/myip', async (_req, res) => {
  try {
    const { data } = await axios.get('https://ipinfo.io/ip');
    res.send(data);
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});
axios.get('https://ipinfo.io/ip').then(r => {
  console.log("서버의 외부IP:", r.data.trim());
});

/* =========================
 * Mongo 연결 (최신 드라이버는 옵션 불필요)
 * ========================= */
mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("MongoDB Connected!");

    /* -----------------------------
     * Router 안전 가드 (문제 라우트 즉시 식별)
     * ----------------------------- */
    const ensureRouter = (mod, name) => {
      if (typeof mod !== 'function') {
        const type = typeof mod;
        console.error(`[BOOT] ${name} 가 Router가 아닙니다. type=${type}`);
        // 흔한 실수: module.exports = router 누락, 파일 경로/대소문자 오타, export object 등
        throw new Error(`${name} must export express.Router()`);
      }
      return mod;
    };

    /* =========================
     * 라우트 모듈 로드
     * ========================= */
    // 기존/신규 라우트
    const attendanceRoutes      = require('./routes/attendanceRoutes');
    const bannerUploadRoutes    = require('./routes/bannerUpload');
    const adminLessonRoutes     = require('./routes/adminLessonRoutes'); // /api/admin/*
    const reportRoutes          = require('./routes/reportRoutes');      // /report, /r/:code
    const classGroupRoutes      = require('./routes/classGroupRoutes');  // 수업반
    const staffLessonRoutes     = require('./routes/staffLessonRoutes'); // 스태프(강사)
    const superSettingsRoutes   = require('./routes/superSettingsRoutes');
    const adminUserRoutes       = require('./routes/adminUserRoutes');
    const publicSiteRoutes      = require('./routes/publicSiteSettingsRoutes');

    /* =========================
     * 정적/공용
     * ========================= */
    app.use('/uploads', express.static('uploads'));

    /* =========================
     * 인증/기본 리소스
     * ========================= */
    app.use('/api/auth',           ensureRouter(require('./routes/authRoutes'), 'authRoutes'));
    app.use('/api/subjects',       ensureRouter(require('./routes/subjectRoutes'), 'subjectRoutes'));
    app.use('/api/chapters',       ensureRouter(require('./routes/chapterRoutes'), 'chapterRoutes'));
    app.use('/api/assignments',    ensureRouter(require('./routes/assignmentRoutes'), 'assignmentRoutes'));
    app.use('/api/users',          ensureRouter(require('./routes/userRoutes'), 'userRoutes'));
    app.use('/api/news',           ensureRouter(require('./routes/newsRoutes'), 'newsRoutes'));
    app.use('/api/materials',      ensureRouter(require('./routes/materialRoutes'), 'materialRoutes'));
    app.use('/api/contact',        ensureRouter(require("./routes/contactRoutes"), 'contactRoutes'));
    app.use('/api/blog',           ensureRouter(require("./routes/blogRoutes"), 'blogRoutes'));
    app.use('/api/settings',       ensureRouter(require('./routes/settingsRoutes'), 'settingsRoutes'));
    // progress 라우트가 두 개면 둘 다 Router 여야 함
    app.use('/api/progress',       ensureRouter(require('./routes/studentProgressRoutes'), 'studentProgressRoutes'));
    app.use('/api/progress',       ensureRouter(require('./routes/progressRoutes'), 'progressRoutes'));
    app.use('/api/schools',        ensureRouter(require('./routes/schoolRoutes'), 'schoolRoutes'));
    app.use('/api/schoolschedules',ensureRouter(require('./routes/schoolScheduleRoutes'), 'schoolScheduleRoutes'));
    app.use('/api/school-periods', ensureRouter(require("./routes/schoolPeriodRoutes"), 'schoolPeriodRoutes'));
    app.use('/api/attendance',     ensureRouter(attendanceRoutes, 'attendanceRoutes'));
    app.use('/api/files',          ensureRouter(require('./routes/upload'), 'uploadRoutes'));
    app.use('/api/banner',         ensureRouter(bannerUploadRoutes, 'bannerUploadRoutes'));

    /* =========================
     * 신규/관리/스태프/공개 설정
     * ========================= */
    app.use('/api/admin',          ensureRouter(adminLessonRoutes, 'adminLessonRoutes'));     // 오늘 수업, 예약/발송
    app.use('/api/admin',          ensureRouter(adminUserRoutes, 'adminUserRoutes'));         // 사용자 관리(관리자/슈퍼)
    app.use('/api/staff',          ensureRouter(staffLessonRoutes, 'staffLessonRoutes'));     // 강사용 엔드포인트
    app.use('/api/admin',          ensureRouter(superSettingsRoutes, 'superSettingsRoutes')); // 슈퍼 사이트 설정
    app.use('/api/class-groups',   ensureRouter(classGroupRoutes, 'classGroupRoutes'));       // 수업반 CRUD/배정
    app.use('/api/admin',          ensureRouter(require('./routes/adminProfileRoutes'), 'adminProfileRoutes'));
    app.use('/api/admin',          ensureRouter(require('./routes/adminCounselRoutes'), 'adminCounselRoutes'));
    app.use('/api/admin',          ensureRouter(require('./routes/adminClassTypeRoutes'), 'adminClassTypeRoutes'));
    app.use('/api/site',           ensureRouter(publicSiteRoutes, 'publicSiteSettingsRoutes'));// 공개 설정 조회

    // 공개 리포트 뷰(/report, /r/:code)
    app.use('/',                   ensureRouter(reportRoutes, 'reportRoutes'));

    // 메인
    app.get('/', (_req, res) => {
      res.send('서버가 정상적으로 동작합니다!');
    });

    /* =========================
     * 샘플 계정/Setting/기본 반 자동 생성 (최초 실행시)
     * ========================= */
    const User = require('./models/User');
    const Setting = require('./models/Setting');
    const ClassGroup = require('./models/ClassGroup');
    const bcrypt = require("bcryptjs");

    (async () => {
      const defaultSettings = [
        { key: "banner1_text", value: "" },
        { key: "banner1_on", value: "false" },
        { key: "banner1_img", value: "" },
        { key: "banner2_text", value: "" },
        { key: "banner2_on", value: "false" },
        { key: "banner2_img", value: "" },
        { key: "banner3_text", value: "" },
        { key: "banner3_on", value: "false" },
        { key: "banner3_img", value: "" },
        { key: "blog_show", value: "true" },
        // 자동/예약 스위치
        { key: "daily_report_auto_on", value: "false" },
        { key: "auto_leave_on", value: "true" },
        { key: "report_jwt_exp_days", value: "7" },
        // 기본 반 이름
        { key: "default_class_name", value: "IG수학" }
      ];
      for (const s of defaultSettings) {
        const found = await Setting.findOne({ key: s.key });
        if (!found) await Setting.create(s);
      }
      console.log("Setting 테이블 기본값 초기화 완료!");

      // 기본 계정 (없으면 생성)
      const mk = async (name, email, role, parentPhone) => {
        const found = await User.findOne({ email });
        if (found) return found;
        const pass = await bcrypt.hash(`${role}1234`, 10);
        const doc = { name, email, password: pass, role };
        if (role === 'student') doc.parentPhone = parentPhone || '01000000000';
        return await User.create(doc);
      };

      const superUser  = await mk("슈퍼관리자", "super@example.com",   "super");
      const adminUser  = await mk("운영자",   "admin@example.com",   "admin");
      const teacherA   = await mk("강사A",    "teacher1@example.com","teacher");
      const studentA   = await mk("학생A",    "student1@example.com","student","01000000001");
      const studentB   = await mk("학생B",    "student2@example.com","student","01000000002");
      console.log("기본 계정 준비 완료:", [superUser.email, adminUser.email, teacherA.email, studentA.email, studentB.email]);

      // 기본 반 자동 생성
      const defaultClassName = (await Setting.findOne({ key: 'default_class_name' }))?.value || 'IG수학';
      let baseClass = await ClassGroup.findOne({ name: defaultClassName });
      if (!baseClass) {
        baseClass = await ClassGroup.create({
          name: defaultClassName,
          academy: 'IG수학',
          days: [],
          timeStart: null,
          timeEnd: null,
          teachers: [adminUser._id, teacherA._id].filter(Boolean),
          students: [studentA._id, studentB._id].filter(Boolean),
          active: true
        });
        console.log(`기본 반 생성: ${baseClass.name}`);
      }
    })();

    /* =========================
     * CRON (DB 연결 이후 등록)
     * ========================= */
    const KST = 'Asia/Seoul';
    const BASE_URL = (process.env.SELF_BASE_URL || `http://127.0.0.1:${PORT}`).replace(/\/+$/,'');

    // 1) 자동 하원
    const AUTO_LEAVE_CRON = process.env.AUTO_LEAVE_CRON || '30 22 * * *';
    if (!global.__AUTO_LEAVE_CRON_STARTED__) {
      global.__AUTO_LEAVE_CRON_STARTED__ = true;
      cron.schedule(AUTO_LEAVE_CRON, async () => {
        try {
          const Setting = require('./models/Setting');
          const ENV_ON = (process.env.CRON_ENABLED_AUTO_LEAVE ?? '1') !== '0';
          const s = await Setting.findOne({ key: 'auto_leave_on' });
          const DB_ON = (s?.value === 'true');
          const SHOULD_RUN = (typeof s?.value === 'string') ? DB_ON : ENV_ON;
          if (!SHOULD_RUN) {
            console.log(`[CRON][AUTO-LEAVE] SKIP (auto OFF) @ ${new Date().toLocaleString('ko-KR', { timeZone: KST })}`);
            return;
          }
          await axios.post(`${BASE_URL}/api/attendance/auto-leave`);
          console.log(`[CRON][AUTO-LEAVE] OK @ ${new Date().toLocaleString('ko-KR', { timeZone: KST })}`);
        } catch (e) {
          console.error(`[CRON][AUTO-LEAVE] FAIL:`, e.message);
        }
      }, { timezone: KST });
    }

    // 2) 일일 리포트 자동 발송
    const DAILY_REPORT_CRON = process.env.DAILY_REPORT_CRON || '30 10 * * *';
    if (!global.__DAILY_REPORT_CRON_STARTED__) {
      global.__DAILY_REPORT_CRON_STARTED__ = true;
      cron.schedule(DAILY_REPORT_CRON, async () => {
        try {
          const ENV_ON = (process.env.DAILY_REPORT_AUTO === '1');
          const Setting = require('./models/Setting');
          const s = await Setting.findOne({ key: 'daily_report_auto_on' });
          const DB_ON = (s?.value === 'true');
          const SHOULD_RUN = (typeof s?.value === 'string') ? DB_ON : ENV_ON;
          if (!SHOULD_RUN) {
            console.log(`[CRON][DAILY-REPORT] SKIP (auto OFF) @ ${new Date().toLocaleString('ko-KR', { timeZone: KST })}`);
            return;
          }
          await axios.post(`${BASE_URL}/api/admin/lessons/send-bulk`);
          console.log(`[CRON][DAILY-REPORT] OK @ ${new Date().toLocaleString('ko-KR', { timeZone: KST })}`);
        } catch (e) {
          console.error(`[CRON][DAILY-REPORT] FAIL:`, e.message);
        }
      }, { timezone: KST });
    }

    /* =========================
     * 서버 시작
     * ========================= */
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
      console.log(`[CORS] allowed origins:`, allowedOrigins);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
  });
