// server/models/TestTemplate.js
const mongoose = require('mongoose');

// 문항 상세 정보 스키마
const QuestionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true }, // 문제 번호
  difficulty: { type: String, enum: ['상', '중', '하'], required: true }, // 난이도
  chapter: { type: String, required: true }, // 단원
  questionType: { type: String, required: true }, // 유형 (계산, 증명, 응용 등)
  points: { type: Number, default: 1 } // 배점
});

// 테스트 템플릿 스키마
const TestTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 테스트명
  subject: { type: String, required: true }, // 과목
  courseId: { type: String, required: true }, // 교육과정 ID (예: 중학교1학년)
  totalQuestions: { type: Number, required: true }, // 총 문제수
  totalPoints: { type: Number, required: true }, // 총 배점
  questions: [QuestionSchema], // 문항별 정보
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 생성자
  isActive: { type: Boolean, default: true } // 활성 상태
}, { timestamps: true });

// 인덱스 설정
TestTemplateSchema.index({ courseId: 1 });
TestTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('TestTemplate', TestTemplateSchema);