const mongoose = require('mongoose');
const AssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true }
});
module.exports = mongoose.model('Assignment', AssignmentSchema);