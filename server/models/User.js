const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  parentPhone: { type: String, default: "" },   // ★ 학부모 휴대폰번호 추가
  active: { type: Boolean, default: true }
});
module.exports = mongoose.model('User', UserSchema);