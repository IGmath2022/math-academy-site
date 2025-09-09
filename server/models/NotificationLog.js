// server/models/NotificationLog.js
const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['등원','하원','일일리포트'], required: true },
  status: { type: String, enum: ['성공','실패'], required: true },
  code: { type: String, default: '' },
  message: { type: String, default: '' },   // 2KB 이내 요약 저장 권장
  payloadSize: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// TTL: NOTIF_TTL_DAYS(기본 180일)
const days = Number(process.env.NOTIF_TTL_DAYS || 180);
NotificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: days * 24 * 60 * 60 });

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
