const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const SchoolEvent = sequelize.define("SchoolEvent", {
    title: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.ENUM("시험", "방학", "기타"), defaultValue: "기타" }
  });
  return SchoolEvent;
};