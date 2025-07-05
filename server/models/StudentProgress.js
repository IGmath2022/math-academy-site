const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const StudentProgress = sequelize.define('StudentProgress', {
    date: { type: DataTypes.DATEONLY, allowNull: false },
    memo: { type: DataTypes.TEXT },
  });
  return StudentProgress;
};