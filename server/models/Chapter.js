const mongoose = require('mongoose');
const ChapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  video_url: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
});
module.exports = mongoose.model('Chapter', ChapterSchema);