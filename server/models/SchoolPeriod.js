const mongoose = require('mongoose');
const SchoolPeriodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  start: { type: String, required: true }, // YYYY-MM-DD
  end: { type: String, required: true },
  type: String,
  note: String,
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
});
module.exports = mongoose.model('SchoolPeriod', SchoolPeriodSchema);