// server/app.js

require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;

// 기존/신규 라우트
const attendanceRoutes     = require('./routes/attendanceRoutes');
const bannerUploadRoutes   = require('./routes/bannerUpload');
const adminLessonRoutes    = require('./routes/adminLessonRoutes'); // /api/admin/*
const reportRoutes         = require('./routes/reportRoutes');      // /report, /r/:code

// === CORS (프론트 주소 넣기!) ===
app.use(cors({
  origin: 'https://ig-math-2022.onrender.com',
  credentials: true
}));
app.use(express.json());

// === 서버 외부 IP 조회 라우터(운영용) ===
app.get('/myip', async (req, res) => {
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

// === 몽구스 연결 ===
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log("MongoDB Connected!");

    // ==== 라우트 연결 (기존 유지) ====
    app.use('/uploads', express.static('uploads'));
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
    // ✅ 출결 라우트는 "한 번만" 마운트하세요(중복 제거)
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/files', require('./routes/upload'));
    app.use('/api/banner', bannerUploadRoutes);

    // ==== 신규 라우트 추가 ====
    app.use('/api/admin', adminLessonRoutes); // 오늘 수업 입력/예약/발송(관리자)
    app.use('/', reportRoutes);               // 공개 리포트 뷰(/report, /r/:code)

    // 메인
    app.get('/', (req, res) => {
      res.send('서버가 정상적으로 동작합니다!');
    });

    // ==== 샘플 계정/Setting 자동 생성 (최초 실행시) ====
    const User = require('./models/User');
    const Setting = require('./models/Setting');
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

        // 신규: 자동/예약용 설정
        { key: "daily_report_auto_on", value: "false" }, // 리포트 자동발송 기본 OFF
        { key: "auto_leave_on", value: "true" },         // 자동하원 기본 ON
        { key: "report_jwt_exp_days", value: "7" }       // 리포트 링크 만료일(일)
      ];
      for (const s of defaultSettings) {
        const found = await Setting.findOne({ key: s.key });
        if (!found) await Setting.create(s);
      }
      console.log("Setting 테이블 기본값 초기화 완료!");

      // 샘플 계정 (admin, student)
      const adminPass    = await bcrypt.hash("admin1234", 10);
      const student1Pass = await bcrypt.hash("student1234", 10);
      const student2Pass = await bcrypt.hash("student1234", 10);

      const defaultUsers = [
        { name: "운영자", email: "admin@example.com",  password: adminPass,    role: "admin"   },
        { name: "학생A",  email: "student1@example.com", password: student1Pass, role: "student" },
        { name: "학생B",  email: "student2@example.com", password: student2Pass, role: "student" }
      ];
      for (const user of defaultUsers) {
        const found = await User.findOne({ email: user.email });
        if (!found) await User.create(user);
      }
      console.log("운영자/샘플 학생 계정 자동 생성 완료!");

      const allUsers = await User.find();
      console.log("DB User 전체 목록:", allUsers.map(u => u.email));
    })();

    // ==== 크론 등록 (DB 연결 이후) ====
    const KST = 'Asia/Seoul';
    const BASE_URL = (process.env.SELF_BASE_URL || `http://127.0.0.1:${PORT}`).replace(/\/+$/,'');

    // 1) 자동 하원 처리 — DB/ENV 토글 지원
    const AUTO_LEAVE_CRON = process.env.AUTO_LEAVE_CRON || '30 22 * * *'; // 기본 22:30 KST
    if (!global.__AUTO_LEAVE_CRON_STARTED__) {
      global.__AUTO_LEAVE_CRON_STARTED__ = true;
      cron.schedule(AUTO_LEAVE_CRON, async () => {
        try {
          const Setting = require('./models/Setting');

          // ENV 기본값(없으면 ON), DB값 있으면 DB 우선
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
    const DAILY_REPORT_CRON = process.env.DAILY_REPORT_CRON || '30 10 * * *'; // 기본 10:30 KST
    if (!global.__DAILY_REPORT_CRON_STARTED__) {
      global.__DAILY_REPORT_CRON_STARTED__ = true;
      cron.schedule(DAILY_REPORT_CRON, async () => {
        try {
          // ENV 스위치 (기본 OFF)
          const ENV_ON = (process.env.DAILY_REPORT_AUTO === '1');

          // DB 스위치 (없으면 ENV 기준)
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

    // ==== 서버 시작 ====
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
  });
