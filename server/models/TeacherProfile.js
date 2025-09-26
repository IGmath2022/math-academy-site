// server/models/TeacherProfile.js
const mongoose = require('mongoose');

const TeacherProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // 강사 기본 정보
  profileImage: { type: String, default: '' }, // 클라우드 스토리지 URL

  // 경력 정보
  experience: { type: String, default: '' }, // 경력 사항
  biography: { type: String, default: '' },   // 이력/소개

  // 담당 과목들
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],

  // 표시 순서
  displayOrder: { type: Number, default: 0 },

  // 공개 여부
  isPublic: { type: Boolean, default: true },

  // 추가 정보
  specialties: [String], // 전문 분야
  education: { type: String, default: '' }, // 학력
  certifications: [String], // 자격증

}, { timestamps: true });

// 인덱스 설정
TeacherProfileSchema.index({ userId: 1 });
TeacherProfileSchema.index({ displayOrder: 1 });
TeacherProfileSchema.index({ isPublic: 1 });

module.exports = mongoose.model('TeacherProfile', TeacherProfileSchema);