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
 * 라우트 require
 * ========================= */
const attendanceRoutes    = require('./routes/attendanceRoutes');
const bannerUploadRoutes  = require('./routes/bannerUpload');
const adminLessonRoutes   = require('./routes/adminLessonRoutes');   // /api/admin/*
const reportRoutes        = require('./routes/reportRoutes');        // /report, /r/:code
const classGroupRoutes    = require('./routes/classGroupRoutes');    // ✅ 수업반(관리/스태프 공유)
const staffLessonRoutes   = require('./routes/staffLessonRoutes');   // /api/staff/lessons/*
const superSettingsRoutes = require('./routes/superSettingsRoutes'); // /api/admin/super/*
const adminUserRoutes     = require('./routes/adminUserRoutes');     // /api/admin/users/*
const staffCounselRoutes  = require('./routes/staffCounselRoutes');  // /api/staff/counsel* (CounselLog)

/* =========================
 * CORS 설정 (다중 오리진)
 *  - .env에 CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://ig-math-2022.onrender.com"
 *    처럼 콤마로 구분하여 넣어둡니다.
 * ========================= */
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://ig-math-2022.onrender.com')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // 서버-서버 호출 허용
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

/* =========================
 * 운영 확인: 서버 외부 IP
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
 * Mongo 연결
 * ========================= */
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log("MongoDB Connected!");

    /* =========================
     * 정적/공용 라우트
     * ========================= */
    app.use('/uploads', express.static('uploads'));

    /* =========================
     * 기존/일반 API
     * ========================= */
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/subjects', require('./routes/subjectRoutes'));
    app.use('/api/chapters', require('./routes/chapterRoutes'));
    app.use('/api/assignments', require('./routes/assignmentRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/news', require('./routes/newsRoutes'));
    app.use('/api/materials', require('./routes/materialRoutes'));
    app.use('/api/contact', require("./routes/contactRoutes"));
    app.use('/api/blog', require("./routes/blogRoutes"));
    app.use('/api/settings', require('./routes/settingsRoutes'));
    app.use('/api/progress', require('./routes/studentProgressRoutes'));
    app.use('/api/progress', require('./routes/progressRoutes'));
    app.use('/api/schools', require('./routes/schoolRoutes'));
    app.use('/api/schoolschedules', require('./routes/schoolScheduleRoutes'));
    app.use('/api/school-periods', require("./routes/schoolPeriodRoutes"));
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/files', require('./routes/upload'));
    app.use('/api/banner', bannerUploadRoutes);

    /* =========================
     * 관리자/스태프 전용 API
     * ========================= */
    // 관리자(레슨 발송/예약 등)
    app.use('/api/admin', adminLessonRoutes);
    // 관리자: 계정/권한
    app.use('/api/admin', adminUserRoutes);
    // 스태프(강사 전용 레슨/월로그/알림 등)
    app.use('/api/staff', staffLessonRoutes);
    // 슈퍼 설정
    app.use('/api/admin', superSettingsRoutes);

    // ✅ 수업반(ClassGroup) - 역할별 접두어로 마운트 (경로 일관성)
    app.use('/api/admin', classGroupRoutes);  // /api/admin/classes, /api/admin/classes/:id/assign
    app.use('/api/staff', classGroupRoutes);  // /api/staff/classes/mine, /api/staff/metrics/workload

    // ✅ 상담(CounselLog) - 스태프 전용
    app.use('/api/staff', staffCounselRoutes); // /api/staff/counsel*

    // 기존 관리자 기타 라우트(프로필/상담/수업형태 등)
    app.use('/api/admin', require('./routes/adminProfileRoutes'));
    app.use('/api/admin', require('./routes/adminCounselRoutes'));
    app.use('/api/admin', require('./routes/adminClassTypeRoutes'));
    app.use('/api/site', require('./routes/publicSiteSettingsRoutes'));

    // 공개 리포트 뷰(/report, /r/:code)
    app.use('/', reportRoutes);

    /* =========================
     * 헬스 체크
     * ========================= */
    app.get('/', (_req, res) => {
      res.send('서버가 정상적으로 동작합니다!');
    });

    /* =========================
     * 최초 실행시 기본 데이터 생성
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

        // 자동/예약 설정
        { key: "daily_report_auto_on", value: "false" }, // 리포트 자동발송 기본 OFF
        { key: "auto_leave_on", value: "true" },         // 자동하원 기본 ON
        { key: "report_jwt_exp_days", value: "7" },      // 리포트 링크 만료일(일)

        // 기본 반 이름
        { key: "default_class_name", value: "IG수학" }
      ];
      for (const s of defaultSettings) {
        const found = await Setting.findOne({ key: s.key });
        if (!found) await Setting.create(s);
      }
      console.log("Setting 테이블 기본값 초기화 완료!");

      // 기본 계정 생성(존재 시 건너뜀)
      const mk = async (name, email, role, parentPhone) => {
        const found = await User.findOne({ email });
        if (found) return found;
        const pass = await bcrypt.hash(`${role}1234`, 10);
        const doc = { name, email, password: pass, role };
        if (role === 'student') doc.parentPhone = parentPhone || '01000000000';
        return await User.create(doc);
      };

      const superUser  = await mk("슈퍼관리자", "super@example.com",  "super");
      const adminUser  = await mk("운영자",   "admin@example.com",  "admin");
      const teacherA   = await mk("강사A",    "teacher1@example.com","teacher");
      const studentA   = await mk("학생A",    "student1@example.com","student","01000000001");
      const studentB   = await mk("학생B",    "student2@example.com","student","01000000002");

      console.log("기본 계정 준비 완료:", [superUser.email, adminUser.email, teacherA.email, studentA.email, studentB.email]);

      // 기본 반 자동 생성 & 학생 배정
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
     * CRON 등록
     * ========================= */
    const KST = 'Asia/Seoul';
    const BASE_URL = (process.env.SELF_BASE_URL || `http://127.0.0.1:${PORT}`).replace(/\/+$/,'');

    // 1) 자동 하원 처리 — DB/ENV 토글 지원
    const AUTO_LEAVE_CRON = process.env.AUTO_LEAVE_CRON || '30 22 * * *'; // 22:30 KST
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

    // 2) 일일 리포트 자동 발송 — ENV/DB 토글 지원(기본 OFF)
    const DAILY_REPORT_CRON = process.env.DAILY_REPORT_CRON || '30 10 * * *'; // 10:30 KST
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
