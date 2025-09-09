// server/models/LessonLog.js
const mongoose = require('mongoose');

const LessonLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'

  course: { type: String, default: '' },
  book: { type: String, default: '' },

  content: { type: String, default: '' },   // 2~4줄 핵심(서버에서 길이 가드)
  homework: { type: String, default: '' },  // 줄바꿈 리스트
  feedback: { type: String, default: '' },  // 상세 본문(저장 1000자 가드 권장)

  diligence: { type: String, enum: ['하','중','상'], default: '중' },
  focus: { type: Number, min: 0, max: 5, default: 0 },

  headline: { type: String, default: '' },  // 한줄 요약(문장)
  tags: { type: [String], default: [] },    // 자유 텍스트(쉼표/엔터 분리)
  nextPlan: { type: String, default: '' },

  progressPct: { type: Number, min: 0, max: 100, default: 0 },

  checkIn: { type: String, default: '' },    // 'HH:mm'
  checkOut: { type: String, default: '' },   // 'HH:mm'
  totalStudyMin: { type: Number, default: 0 },

  classType: { type: String, default: '' },  // 예: 개별맞춤수업/판서강의/방학특강 ...
  groupSize: { type: Number, default: 1 },

  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  teacherName: { type: String, default: '' },

  scheduledAt: { type: Date, default: null }, // 기본: 다음날 10:30 예정
  notifyStatus: { type: String, enum: ['대기','발송','실패'], default: '대기' },
  notifyLog: { type: String, default: '' },
}, { timestamps: true });

LessonLogSchema.index({ studentId: 1, date: 1 }, { unique: true });
LessonLogSchema.index({ notifyStatus: 1, scheduledAt: 1 });

module.exports = mongoose.model('LessonLog', LessonLogSchema);
