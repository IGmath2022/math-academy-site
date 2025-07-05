const mongoose = require('mongoose');
const SchoolEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  type: { type: String, enum: ['시험', '방학', '기타'], default: '기타' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
});
module.exports = mongoose.model('SchoolEvent', SchoolEventSchema);