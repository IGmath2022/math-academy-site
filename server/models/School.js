const mongoose = require('mongoose');
const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true }
});
SchoolSchema.virtual('SchoolPeriods', {
  ref: 'SchoolPeriod',
  localField: '_id',
  foreignField: 'schoolId'
});
SchoolSchema.set('toObject', { virtuals: true });
SchoolSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('School', SchoolSchema);