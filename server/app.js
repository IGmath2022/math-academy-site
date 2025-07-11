require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
const attendanceRoutes = require('./routes/attendanceRoutes');

// CORS (프론트 주소 꼭 넣기!)
app.use(cors({
  origin: 'https://ig-math-2022.onrender.com',
  credentials: true
}));
app.use(express.json());

const cron = require('node-cron');
cron.schedule('30 22 * * *', async () => {
  // 매일 22:30에 자동 하원 처리 API 호출
  try {
    await axios.post('https://math-academy-server.onrender.com/api/attendance/auto-leave');
    console.log('자동 하원처리 완료');
  } catch (e) {
    console.error('자동 하원처리 실패', e);
  }
});

// (예시) 임시로 추가: http://서버주소/api/myip 로 접속
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
  .then(() => {
    console.log("MongoDB Connected!");

    // ==== 라우트 연결 ====
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
    app.use('/api/attendance', require('./routes/attendanceRoutes'));
    app.use('/api/attendance', attendanceRoutes);

    // 메인
    app.get('/', (req, res) => {
      res.send('서버가 정상적으로 동작합니다!');
    });

    // ==== 샘플 계정 자동 생성 (최초 실행시) ====
    // mongoose 방식에 맞게 Schema/model이 만들어져 있어야 함!
    // 예: User, Setting 등이 mongoose model로 정의되어 있어야 함
    const User = require('./models/User');     // mongoose model 예시
    const Setting = require('./models/Setting');
    const bcrypt = require("bcryptjs");

    (async () => {
      // Setting 테이블(컬렉션) 초기값
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
        { key: "blog_show", value: "true" }
      ];
      for (const s of defaultSettings) {
        const found = await Setting.findOne({ key: s.key });
        if (!found) await Setting.create(s);
      }
      console.log("Setting 테이블 기본값 초기화 완료!");

      // 샘플 계정 (admin, student)
      const adminPass = await bcrypt.hash("admin1234", 10);
      const student1Pass = await bcrypt.hash("student1234", 10);
      const student2Pass = await bcrypt.hash("student1234", 10);

      const defaultUsers = [
        {
          name: "운영자",
          email: "admin@example.com",
          password: adminPass,
          role: "admin",
        },
        {
          name: "학생A",
          email: "student1@example.com",
          password: student1Pass,
          role: "student",
        },
        {
          name: "학생B",
          email: "student2@example.com",
          password: student2Pass,
          role: "student",
        }
      ];
      for (const user of defaultUsers) {
        const found = await User.findOne({ email: user.email });
        if (!found) await User.create(user);
      }
      console.log("운영자/샘플 학생 계정 자동 생성 완료!");

      // DB 전체 사용자 콘솔 확인
      const allUsers = await User.find();
      console.log("DB User 전체 목록:", allUsers.map(u => u.email));
    })();

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
  });