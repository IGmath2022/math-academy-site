const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const SchoolSchedule = sequelize.define('SchoolSchedule', {
    name: { type: DataTypes.STRING, allowNull: false },      // "1학기 중간고사" 등
    type: { type: DataTypes.STRING },                        // "시험", "방학", "행사" 등
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
  });
  return SchoolSchedule;
};