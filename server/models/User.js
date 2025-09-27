// server/models/User.js
const mongoose = require('mongoose');

const ROLES = ['super', 'admin', 'teacher', 'student'];

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, unique: true, required: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ROLES, default: 'student' },

  // 학생 정보 관련 필드들
  phone:        { type: String, default: "" }, // 학생 본인 연락처
  grade:        { type: String, default: "" }, // 학년
  schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  parentName:   { type: String, default: "" }, // 학부모 성함
  parentPhone:  { type: String, default: "" }, // 학부모 연락처
  memo:         { type: String, default: "" }, // 메모
  active:       { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLES = ROLES;
