const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const SchoolPeriod = sequelize.define("SchoolPeriod", {
    name: { type: DataTypes.STRING, allowNull: false }, // 기간명: 방학/시험/행사명 등
    start: { type: DataTypes.DATEONLY, allowNull: false },
    end: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.STRING }, // '방학', '시험', '행사' 등 구분
    note: { type: DataTypes.TEXT }, // 비고/설명
  });
  return SchoolPeriod;
};