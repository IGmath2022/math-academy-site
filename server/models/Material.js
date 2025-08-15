const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  file: { type: String, required: true }, // R2에 저장된 key
  originalName: { type: String, required: true }, // 📌 원본 파일명
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true // createdAt, updatedAt 자동 생성
});

module.exports = mongoose.model('Material', MaterialSchema);