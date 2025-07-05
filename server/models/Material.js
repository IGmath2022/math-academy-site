const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Material = sequelize.define('Material', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    file: { type: DataTypes.STRING, allowNull: false }
  });
  return Material;
};