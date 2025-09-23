const { Sequelize } = require('sequelize');

// 환경에 따라 데이터베이스 설정 결정
const isDevelopment = process.env.NODE_ENV !== 'production';
const usePostgres = process.env.DATABASE_URL; // Render에서 PostgreSQL 사용 시

let sequelize;

if (usePostgres) {
  // Render에서 PostgreSQL 사용
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
  });
} else if (isDevelopment) {
  // 개발환경에서 SQLite 사용
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite',
    logging: false,
  });
} else {
  // 운영환경에서는 MongoDB만 사용하거나 에러 발생
  console.warn('[DB] No database configured for production. Using MongoDB only.');
  sequelize = null;
}

module.exports = sequelize;