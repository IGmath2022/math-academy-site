// server/setPassword.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function setSuperPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const superUser = await User.findOne({ email: 'super@example.com' });
    if (superUser) {
      const newPassword = await bcrypt.hash('super123', 10);
      superUser.password = newPassword;
      await superUser.save();

      console.log('슈퍼계정 비밀번호가 설정되었습니다:');
      console.log('이메일: super@example.com');
      console.log('비밀번호: super123');
    } else {
      console.log('슈퍼계정을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('에러:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setSuperPassword();