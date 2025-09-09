// server/models/CounselLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CounselLogSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },     // YYYY-MM-DD
  memo: { type: String, default: '' },
  publicOn: { type: Boolean, default: false } // 공개뷰에 포함 여부
}, { timestamps: true, collection: 'counsel_logs' });

CounselLogSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('CounselLog', CounselLogSchema);
