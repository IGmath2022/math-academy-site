const mongoose = require('mongoose');
const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
});
module.exports = mongoose.model('Subject', SubjectSchema);