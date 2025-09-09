// server/models/LessonLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonLogSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },           // YYYY-MM-DD

  // 기본
  course: { type: String, default: '' },            // 과정
  book: { type: String, default: '' },              // 교재
  content: { type: String, default: '' },           // 수업내용
  homework: { type: String, default: '' },          // 과제
  feedback: { type: String, default: '' },          // 개별 피드백

  // 확장 필드
  focus: { type: Number, default: null },           // 집중도(0~100)
  durationMin: { type: Number, default: null },     // 학습시간(분)
  progressPct: { type: Number, default: null },     // 진행률(%)
  nextPlan: { type: String, default: '' },          // 다음 수업 계획
  headline: { type: String, default: '' },          // 핵심 한 줄
  tags: { type: [String], default: [] },            // 쉼표 분리 저장
  classType: { type: String, default: '' },         // 수업 형태(마스터에서 선택)
  teacher: { type: String, default: '' },           // 강사명(로그인 사용자명 등)

  // 발송상태
  notifyStatus: { type: String, default: '대기' },  // 대기/발송/실패
  notifyLog: { type: String, default: '' },
  scheduledAt: { type: Date, default: null },       // 예약 발송 시간(다음날 10:30 등)
}, { timestamps: true, collection: 'lesson_logs' });

LessonLogSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LessonLog', LessonLogSchema);
