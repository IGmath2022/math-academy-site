// server/models/TestResult.js
const mongoose = require('mongoose');

// 문항별 답안 스키마
const AnswerSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true }, // 문제 번호
  isCorrect: { type: Boolean, required: true }, // 정답 여부
  studentAnswer: { type: String, default: "" } // 학생 답안 (선택사항)
});

// 테스트 결과 스키마
const TestResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 학생
  testTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestTemplate', required: true }, // 테스트 템플릿
  testDate: { type: Date, default: Date.now }, // 응시일
  totalScore: { type: Number, required: true }, // 총 점수
  totalPossibleScore: { type: Number, required: true }, // 만점
  answers: [AnswerSchema], // 문항별 답안

  // 자동 계산되는 분석 데이터
  difficultyStats: {
    hard: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
    medium: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
    easy: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } }
  },
  chapterStats: {
    type: Map,
    of: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  }, // 단원별 통계
  typeStats: {
    type: Map,
    of: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  }, // 유형별 통계

  // 추가 정보
  timeSpent: { type: Number, default: 0 }, // 소요 시간 (분)
  notes: { type: String, default: "" } // 메모
}, { timestamps: true });

module.exports = mongoose.model('TestResult', TestResultSchema);