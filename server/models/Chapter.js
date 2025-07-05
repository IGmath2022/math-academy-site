const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Chapter = sequelize.define('Chapter', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    video_url: DataTypes.STRING,
  });
  return Chapter;
};