// server/models/LessonLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonLogSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD

    // 기본 텍스트
    course:   { type: String, default: '' }, // 과정
    book:     { type: String, default: '' }, // 교재
    content:  { type: String, default: '' }, // 수업내용
    homework: { type: String, default: '' }, // 과제
    feedback: { type: String, default: '' }, // 개별 피드백

    // 지표/요약
    focus:       { type: Number, default: null }, // 0~100
    progressPct: { type: Number, default: null }, // 0~100
    headline:    { type: String, default: '' },   // 핵심 한 줄

    // 시간/계획
    studyTimeMin: { type: Number, default: null }, // 학습시간(분) - 신규
    durationMin:  { type: Number, default: null }, // (레거시 호환)
    planNext:     { type: String, default: '' },   // 다음 수업 계획 - 신규
    nextPlan:     { type: String, default: '' },   // (레거시 호환)

    // 메타
    tags:      { type: [String], default: [] },  // 쉼표 분리 저장 가능
    classType: { type: String, default: '' },    // 수업 형태
    teacherName: { type: String, default: '' },  // 강사명 - 신규
    teacher:     { type: String, default: '' },  // (레거시 호환)

    // 발송 상태
    notifyStatus: { type: String, default: '대기' }, // 대기/발송/실패
    notifyLog:    { type: String, default: '' },
    scheduledAt:  { type: Date,   default: null },   // 예약 발송 시간
  },
  { timestamps: true, collection: 'lesson_logs' }
);

// 동일 학생의 같은 날짜는 한 건만
LessonLogSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LessonLog', LessonLogSchema);
