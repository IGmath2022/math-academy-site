const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite', // 같은 폴더에 db.sqlite 파일 생성됨
  logging: false,
});

module.exports = sequelize;