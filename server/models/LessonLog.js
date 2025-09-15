// server/models/LessonLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonLogSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD

    // 기본
    course:   { type: String, default: '' }, // 과정
    book:     { type: String, default: '' }, // 교재
    content:  { type: String, default: '' }, // 수업내용
    homework: { type: String, default: '' }, // 과제
    feedback: { type: String, default: '' }, // 개별 피드백

    // 확장 지표
    focus:       { type: Number, default: null }, // 집중도(0~100)
    durationMin: { type: Number, default: null }, // 학습시간(분)
    progressPct: { type: Number, default: null }, // 진행률(%)

    // ✅ 새 표준: 다음 수업 계획 (에디터/센더에서 사용하는 키)
    planNext: { type: String, default: '' },

    // ⛳️ 구버전 호환: 예전 코드가 쓰던 필드명
    nextPlan: { type: String, default: '' },

    headline:  { type: String, default: '' },  // 핵심 한 줄
    tags:      { type: [String], default: [] }, // 쉼표 분리 저장
    classType: { type: String, default: '' },   // 수업 형태
    teacher:   { type: String, default: '' },   // 강사명

    // 그날 등원/하원 시각(HH:mm)
    inTime:  { type: String, default: null },
    outTime: { type: String, default: null },

    // 발송상태
    notifyStatus: { type: String, default: '대기' }, // 대기/발송/실패
    notifyLog:    { type: String, default: '' },
    scheduledAt:  { type: Date,   default: null },   // 예약 발송 시간
  },
  {
    timestamps: true,
    collection: 'lesson_logs',
  }
);

// 유니크 키: 학생+날짜 1건
LessonLogSchema.index({ studentId: 1, date: 1 }, { unique: true });

/**
 * 저장 전 호환 처리:
 * - planNext만 들어오면 nextPlan도 채워 구(old 뷰/레포트) 호환
 * - nextPlan만 들어오면 planNext를 채워 신(new 뷰/API) 호환
 */
LessonLogSchema.pre('save', function (next) {
  if (this.planNext && !this.nextPlan) this.nextPlan = this.planNext;
  if (!this.planNext && this.nextPlan) this.planNext = this.nextPlan;
  next();
});

/**
 * 출력 시 항상 planNext가 보장되도록 변환
 * (구데이터(nextPlan만 있음)도 클라이언트에서 동일하게 사용 가능)
 */
LessonLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    if (!ret.planNext && ret.nextPlan) ret.planNext = ret.nextPlan;
    return ret;
  },
});

module.exports = mongoose.model('LessonLog', LessonLogSchema);
