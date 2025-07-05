const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Assignment = sequelize.define('Assignment', {});
  return Assignment;
};