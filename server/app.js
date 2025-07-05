require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000;

// ⭐️ [1] models/index.js에서 모든 모델과 관계 한 번에 불러오기!
const { sequelize, User, School, SchoolPeriod, Setting } = require('./models');
const bcrypt = require("bcryptjs");

// [2] 미들웨어
app.use(cors());
app.use(express.json());

// [3] 라우트 연결
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


// [4] 메인 페이지
app.get('/', (req, res) => {
  res.send('서버가 정상적으로 동작합니다!');
});

// ⭐️ [5] DB 동기화 + Setting/계정 초기값
sequelize.sync({ alter: true }).then(async () => {
  console.log('DB 동기화 완료!');

  // Setting 기본값
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
    const found = await Setting.findByPk(s.key);
    if (!found) await Setting.create(s);
  }
  console.log("Setting 테이블 기본값 초기화 완료!");

  // === ⭐️ [추가] 운영자/학생 계정 샘플 자동생성 ===
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
    const found = await User.findOne({ where: { email: user.email } });
    if (!found) await User.create(user);
  }
  console.log("운영자/샘플 학생 계정 자동 생성 완료!");

  // 실제 DB에 잘 들어갔는지 콘솔 확인용
  const allUsers = await User.findAll();
  console.log("DB User 전체 목록:", allUsers.map(u => u.email));

  // [6] 서버 실행
  const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
});
});