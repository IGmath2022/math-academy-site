const sequelize = require('./db');
const User = require('./models/User');

async function main() {
  await sequelize.sync();
  const users = await User.findAll();
  console.log('\n--- 등록된 모든 계정 목록 ---');
  users.forEach(u => {
    console.log(`이름: ${u.name}, 이메일: ${u.email}, 역할: ${u.role}`);
  });
  process.exit();
}

main();