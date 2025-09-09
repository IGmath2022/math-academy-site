// server/models/StudentProfile.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentProfileSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  school: { type: String, default: '' },    // ○○중 3 / ○○고 1 등 자유기입
  grade: { type: String, default: '' },     // 선택/자유
  targetHigh: { type: String, default: '' },
  targetUniv: { type: String, default: '' },
  roadmap3m: { type: String, default: '' }, // 3개월 목표
  roadmap6m: { type: String, default: '' }, // 6개월 목표
  roadmap12m:{ type: String, default: '' }, // 12개월 목표
  publicOn: { type: Boolean, default: false } // 공개뷰 노출 여부
}, { timestamps: true, collection: 'student_profiles' });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
