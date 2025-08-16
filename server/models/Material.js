const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  file: { type: String, required: true }, // R2에 저장된 Key
  originalName: { type: String, required: true }, // ✅ 원본 파일명 (한글 포함)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Material', MaterialSchema);