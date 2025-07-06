const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
  date: { type: String, required: true },
  memo: { type: String },
  // checked: { type: Boolean, default: false } // 필요시 추가
});

module.exports = mongoose.model('StudentProgress', studentProgressSchema);