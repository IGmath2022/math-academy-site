// server/checkSuper.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkAndCreateSuper() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB 연결됨');

    // 슈퍼 사용자 확인
    const superUsers = await User.find({ role: 'super' });
    console.log('슈퍼 사용자 수:', superUsers.length);

    if (superUsers.length > 0) {
      console.log('슈퍼 사용자 목록:');
      superUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}), 활성: ${user.active}`);
      });
    } else {
      console.log('슈퍼 사용자가 없습니다. 생성하겠습니다...');

      const hashedPassword = await bcrypt.hash('super123', 10);
      const superUser = new User({
        name: '슈퍼관리자',
        email: 'super@academy.com',
        password: hashedPassword,
        role: 'super',
        active: true
      });

      await superUser.save();
      console.log('슈퍼 사용자가 생성되었습니다:');
      console.log(`이메일: super@academy.com`);
      console.log(`비밀번호: super123`);
    }

    // 모든 사용자의 역할 확인
    const allUsers = await User.find({}, 'name email role active');
    console.log('\n전체 사용자 목록:');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - 역할: ${user.role}, 활성: ${user.active}`);
    });

  } catch (error) {
    console.error('에러:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB 연결 종료');
  }
}

checkAndCreateSuper();