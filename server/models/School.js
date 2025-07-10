const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

// ★ 학교 일정(기간) virtual 필드 추가!
SchoolSchema.virtual('SchoolPeriods', {
  ref: 'SchoolPeriod',                // 참조할 모델
  localField: '_id',                  // School의 PK
  foreignField: 'schoolId'            // SchoolPeriod의 FK
});
SchoolSchema.set('toObject', { virtuals: true });
SchoolSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('School', SchoolSchema);