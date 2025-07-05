const mongoose = require('mongoose');
const SchoolScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
});
module.exports = mongoose.model('SchoolSchedule', SchoolScheduleSchema);