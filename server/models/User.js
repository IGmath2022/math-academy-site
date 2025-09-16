// server/models/User.js
const mongoose = require('mongoose');

const ROLES = ['super', 'admin', 'teacher', 'student'];

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, unique: true, required: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ROLES, default: 'student' },

  schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  parentPhone:  { type: String, default: "" }, // 학부모 연락처(학생 계정일 때 사용)
  active:       { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLES = ROLES;
