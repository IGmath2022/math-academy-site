const mongoose = require('mongoose');

// 단원별 분석 데이터 스키마
const ChapterAnalysisSchema = new mongoose.Schema({
  chapterId: { type: String, required: true }, // 단원 ID
  chapterName: { type: String, required: true }, // 단원명
  totalQuestions: { type: Number, default: 0 }, // 총 문제 수
  correctAnswers: { type: Number, default: 0 }, // 정답 수
  accuracy: { type: Number, default: 0 }, // 정답률 (%)
  level: {
    type: String,
    enum: ['많이 미흡', '미흡', '보통', '잘 안다'],
    default: '미흡'
  }, // 학습 수준
  lastUpdated: { type: Date, default: Date.now }
});

// 유형별 분석 데이터 스키마
const TypeAnalysisSchema = new mongoose.Schema({
  chapterId: { type: String, required: true }, // 소속 단원 ID
  chapterName: { type: String, required: true }, // 소속 단원명
  typeId: { type: String, required: true }, // 유형 ID
  typeName: { type: String, required: true }, // 유형명
  totalQuestions: { type: Number, default: 0 }, // 총 문제 수
  correctAnswers: { type: Number, default: 0 }, // 정답 수
  accuracy: { type: Number, default: 0 }, // 정답률 (%)
  level: {
    type: String,
    enum: ['많이 미흡', '미흡', '보통', '잘 안다'],
    default: '미흡'
  }, // 학습 수준
  lastUpdated: { type: Date, default: Date.now }
});

// 난이도별 분석 데이터 스키마
const DifficultyAnalysisSchema = new mongoose.Schema({
  difficulty: { type: String, enum: ['상', '중', '하'], required: true },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['많이 미흡', '미흡', '보통', '잘 안다'],
    default: '미흡'
  },
  lastUpdated: { type: Date, default: Date.now }
});

// 학생별 누적 분석 데이터 스키마
const StudentAnalysisSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: String, required: true }, // 교육과정 ID
  courseName: { type: String, required: true }, // 교육과정명

  // 전체 통계
  totalTests: { type: Number, default: 0 }, // 응시한 테스트 수
  totalQuestions: { type: Number, default: 0 }, // 총 문제 수
  totalCorrect: { type: Number, default: 0 }, // 총 정답 수
  overallAccuracy: { type: Number, default: 0 }, // 전체 정답률

  // 단원별 분석
  chapterAnalysis: [ChapterAnalysisSchema],

  // 유형별 분석
  typeAnalysis: [TypeAnalysisSchema],

  // 난이도별 분석
  difficultyAnalysis: [DifficultyAnalysisSchema],

  // 최근 성적 추이 (최근 10회)
  recentScores: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestTemplate' },
    testName: String,
    score: Number,
    totalScore: Number,
    accuracy: Number,
    testDate: { type: Date, default: Date.now }
  }],

  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// 인덱스 설정
StudentAnalysisSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
StudentAnalysisSchema.index({ studentId: 1 });
StudentAnalysisSchema.index({ courseId: 1 });

// 학습 수준 판정 함수
StudentAnalysisSchema.statics.calculateLevel = function(accuracy) {
  if (accuracy >= 90) return '잘 안다';
  if (accuracy >= 70) return '보통';
  if (accuracy >= 50) return '미흡';
  return '많이 미흡';
};

// 단원별 분석 업데이트 메서드
StudentAnalysisSchema.methods.updateChapterAnalysis = function(chapterId, chapterName, isCorrect) {
  let chapter = this.chapterAnalysis.find(c => c.chapterId === chapterId);

  if (!chapter) {
    chapter = {
      chapterId,
      chapterName,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      level: '미흡'
    };
    this.chapterAnalysis.push(chapter);
  }

  chapter.totalQuestions++;
  if (isCorrect) chapter.correctAnswers++;

  chapter.accuracy = Math.round((chapter.correctAnswers / chapter.totalQuestions) * 100);
  chapter.level = this.constructor.calculateLevel(chapter.accuracy);
  chapter.lastUpdated = new Date();
};

// 유형별 분석 업데이트 메서드
StudentAnalysisSchema.methods.updateTypeAnalysis = function(chapterId, chapterName, typeId, typeName, isCorrect) {
  let type = this.typeAnalysis.find(t => t.chapterId === chapterId && t.typeId === typeId);

  if (!type) {
    type = {
      chapterId,
      chapterName,
      typeId,
      typeName,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      level: '미흡'
    };
    this.typeAnalysis.push(type);
  }

  type.totalQuestions++;
  if (isCorrect) type.correctAnswers++;

  type.accuracy = Math.round((type.correctAnswers / type.totalQuestions) * 100);
  type.level = this.constructor.calculateLevel(type.accuracy);
  type.lastUpdated = new Date();
};

// 난이도별 분석 업데이트 메서드
StudentAnalysisSchema.methods.updateDifficultyAnalysis = function(difficulty, isCorrect) {
  let diff = this.difficultyAnalysis.find(d => d.difficulty === difficulty);

  if (!diff) {
    diff = {
      difficulty,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      level: '미흡'
    };
    this.difficultyAnalysis.push(diff);
  }

  diff.totalQuestions++;
  if (isCorrect) diff.correctAnswers++;

  diff.accuracy = Math.round((diff.correctAnswers / diff.totalQuestions) * 100);
  diff.level = this.constructor.calculateLevel(diff.accuracy);
  diff.lastUpdated = new Date();
};

// 최근 성적 추가 메서드
StudentAnalysisSchema.methods.addRecentScore = function(testData) {
  this.recentScores.unshift(testData);

  // 최근 10개만 유지
  if (this.recentScores.length > 10) {
    this.recentScores = this.recentScores.slice(0, 10);
  }
};

// 전체 통계 업데이트 메서드
StudentAnalysisSchema.methods.updateOverallStats = function() {
  this.overallAccuracy = this.totalQuestions > 0
    ? Math.round((this.totalCorrect / this.totalQuestions) * 100)
    : 0;
  this.lastUpdated = new Date();
};

// JSON 변환 시 가상 필드 포함
StudentAnalysisSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StudentAnalysis', StudentAnalysisSchema);