const sequelize = require("../db");

// 모델 정의 함수 import
const User = require("./User")(sequelize);
const School = require("./School")(sequelize);
const SchoolPeriod = require("./SchoolPeriod")(sequelize);
const Subject = require("./Subject")(sequelize);
const Chapter = require("./Chapter")(sequelize);
const Assignment = require("./Assignment")(sequelize);
const StudentProgress = require("./StudentProgress")(sequelize);
const Setting = require("./Setting")(sequelize);
const Material = require("./Material")(sequelize);
const News = require("./News")(sequelize);
const SchoolSchedule = require("./SchoolSchedule")(sequelize);
const SchoolEvent = require("./SchoolEvent")(sequelize);

// 관계 정의
User.belongsTo(School, { foreignKey: "schoolId" });
School.hasMany(User, { foreignKey: "schoolId" });

SchoolPeriod.belongsTo(School, { foreignKey: "schoolId" });
School.hasMany(SchoolPeriod, { foreignKey: "schoolId" });

Chapter.belongsTo(Subject, { foreignKey: 'subjectId' });

Assignment.belongsTo(User, { foreignKey: 'userId' });
Assignment.belongsTo(Chapter, { foreignKey: 'chapterId' });

StudentProgress.belongsTo(User, { foreignKey: 'userId' });
StudentProgress.belongsTo(Chapter, { foreignKey: 'chapterId' });

Material.belongsTo(User, { foreignKey: 'userId', allowNull: true });

SchoolSchedule.belongsTo(School, { foreignKey: "schoolId" });

SchoolEvent.belongsTo(School, { foreignKey: "schoolId" });

// ... (다른 관계도 이곳에서만 추가)

module.exports = {
  sequelize,
  User,
  School,
  SchoolPeriod,
  Subject,
  Chapter,
  Assignment,
  StudentProgress,
  Setting,
  Material,
  News,
  SchoolSchedule,
  SchoolEvent,
};