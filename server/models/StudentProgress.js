const mongoose = require('mongoose');
const StudentProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  memo: String,
});
module.exports = mongoose.model('StudentProgress', StudentProgressSchema);