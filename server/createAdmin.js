const User = require('./models/User');
const sequelize = require('./db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  await sequelize.sync();
  const password = await bcrypt.hash('6064', 10);
  await User.create({
    name: '송인규',
    email: '0925thddlsrb@naver.com',
    password,
    role: 'admin'
  });
  console.log('관리자 계정 생성 완료!');
  process.exit();
}

createAdmin();