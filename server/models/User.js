const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'admin'), defaultValue: 'student' },
    schoolId: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  });
  return User;
};