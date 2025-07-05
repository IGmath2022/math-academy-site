const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Setting = sequelize.define("Setting", {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
    },
  });
  return Setting;
};