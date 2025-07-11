const mongoose = require('mongoose');
const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  type: { type: String, enum: ['IN', 'OUT'], required: true }, // 등/하원
  time: { type: String, required: true }, // HH:mm:ss
  auto: { type: Boolean, default: false }, // 자동 하원 여부
  notified: { type: Boolean, default: false }, // 알림톡 전송 여부
});
module.exports = mongoose.model('Attendance', AttendanceSchema);