const sequelize = require('./db');
const User = require('./models/User');

async function main() {
  await sequelize.sync();

  // 여기서 이메일을 "삭제하고 싶은 관리자 이메일"로 바꿔주세요!
  const targetEmail = '0925thddlarb@naver.com';

  const admin = await User.findOne({ where: { email: targetEmail, role: 'admin' } });
  if (!admin) {
    console.log('해당 이메일의 관리자 계정을 찾을 수 없습니다.');
  } else {
    await admin.destroy();
    console.log('관리자 계정 삭제 완료!');
  }

  process.exit();
}

main();