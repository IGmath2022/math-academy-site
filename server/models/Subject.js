const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
  });
  return Subject;
};