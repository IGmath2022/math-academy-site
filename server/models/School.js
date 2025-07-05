const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const School = sequelize.define("School", {
    name: { type: DataTypes.STRING, allowNull: false },
  });
  return School;
};