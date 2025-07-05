const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // 몽구스 User 스키마

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true, useUnifiedTopology: true
})
.then(async () => {
  console.log("MongoDB Connected!");

  // === 샘플 계정 자동 생성 ===
  // 운영자
  let admin = await User.findOne({ email: "admin@example.com" });
  if (!admin) {
    admin = await User.create({
      name: "운영자",
      email: "admin@example.com",
      password: await bcrypt.hash("admin1234", 10),
      role: "admin"
    });
    console.log("운영자 계정 생성 완료!");
  }

  // 학생1
  let student1 = await User.findOne({ email: "student1@example.com" });
  if (!student1) {
    student1 = await User.create({
      name: "학생A",
      email: "student1@example.com",
      password: await bcrypt.hash("student1234", 10),
      role: "student"
    });
    console.log("학생1 계정 생성 완료!");
  }

  // 학생2
  let student2 = await User.findOne({ email: "student2@example.com" });
  if (!student2) {
    student2 = await User.create({
      name: "학생B",
      email: "student2@example.com",
      password: await bcrypt.hash("student1234", 10),
      role: "student"
    });
    console.log("학생2 계정 생성 완료!");
  }

  // ... 서버 실행
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
  });
})
.catch(err => console.log(err));