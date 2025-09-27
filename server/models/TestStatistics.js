const mongoose = require('mongoose');

// 문제별 통계 스키마
const QuestionStatsSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  difficulty: { type: String, enum: ['상', '중', '하'], required: true },
  chapter: { type: String, required: true },
  questionType: { type: String, required: true },
  totalAttempts: { type: Number, default: 0 }, // 총 응시자 수
  correctCount: { type: Number, default: 0 }, // 정답자 수
  accuracy: { type: Number, default: 0 }, // 정답률 (%)
  avgTimeSpent: { type: Number, default: 0 }, // 평균 소요 시간 (초)
  lastUpdated: { type: Date, default: Date.now }
});

// 테스트지별 통계 스키마
const TestStatisticsSchema = new mongoose.Schema({
  testTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestTemplate', required: true },
  testName: { type: String, required: true },
  courseId: { type: String, required: true },
  subject: { type: String, required: true },

  // 전체 통계
  totalAttempts: { type: Number, default: 0 }, // 총 응시자 수
  averageScore: { type: Number, default: 0 }, // 평균 점수
  averageAccuracy: { type: Number, default: 0 }, // 평균 정답률
  standardDeviation: { type: Number, default: 0 }, // 표준편차
  maxScore: { type: Number, default: 0 }, // 최고 점수
  minScore: { type: Number, default: 0 }, // 최저 점수

  // 점수 분포 (10점 단위)
  scoreDistribution: [{
    range: String, // "0-10", "11-20", ..., "91-100"
    count: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],

  // 난이도별 통계
  difficultyStats: {
    상: {
      totalQuestions: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 }
    },
    중: {
      totalQuestions: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 }
    },
    하: {
      totalQuestions: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 }
    }
  },

  // 단원별 통계
  chapterStats: [{
    chapterId: String,
    chapterName: String,
    totalQuestions: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 }
  }],

  // 유형별 통계
  typeStats: [{
    chapterId: String,
    chapterName: String,
    typeId: String,
    typeName: String,
    totalQuestions: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 }
  }],

  // 문제별 상세 통계
  questionStats: [QuestionStatsSchema],

  // 시간별 통계
  timeStats: {
    averageTestTime: { type: Number, default: 0 }, // 평균 시험 시간 (분)
    fastestTime: { type: Number, default: 0 }, // 최단 시간
    slowestTime: { type: Number, default: 0 }, // 최장 시간
    timeDistribution: [{
      range: String, // "0-30분", "31-60분", "61-90분", "90분 이상"
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }]
  },

  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// 인덱스 설정
TestStatisticsSchema.index({ testTemplateId: 1 }, { unique: true });
TestStatisticsSchema.index({ courseId: 1 });
TestStatisticsSchema.index({ testName: 1 });

// 점수 분포 초기화 메서드
TestStatisticsSchema.methods.initializeScoreDistribution = function() {
  this.scoreDistribution = [];
  for (let i = 0; i <= 100; i += 10) {
    const range = i === 100 ? "100" : `${i}-${i + 9}`;
    this.scoreDistribution.push({
      range,
      count: 0,
      percentage: 0
    });
  }
};

// 시간 분포 초기화 메서드
TestStatisticsSchema.methods.initializeTimeDistribution = function() {
  this.timeStats.timeDistribution = [
    { range: "0-30분", count: 0, percentage: 0 },
    { range: "31-60분", count: 0, percentage: 0 },
    { range: "61-90분", count: 0, percentage: 0 },
    { range: "90분 이상", count: 0, percentage: 0 }
  ];
};

// 새 테스트 결과 추가 메서드
TestStatisticsSchema.methods.addTestResult = function(testResult, template) {
  // 전체 통계 업데이트
  this.totalAttempts++;

  const currentScore = testResult.totalScore;
  const maxPossibleScore = testResult.totalPossibleScore;
  const accuracy = Math.round((currentScore / maxPossibleScore) * 100);

  // 평균 계산 (누적 평균)
  this.averageScore = Math.round(
    ((this.averageScore * (this.totalAttempts - 1)) + currentScore) / this.totalAttempts
  );

  this.averageAccuracy = Math.round(
    ((this.averageAccuracy * (this.totalAttempts - 1)) + accuracy) / this.totalAttempts
  );

  // 최고/최저 점수 업데이트
  if (this.totalAttempts === 1) {
    this.maxScore = this.minScore = currentScore;
  } else {
    this.maxScore = Math.max(this.maxScore, currentScore);
    this.minScore = Math.min(this.minScore, currentScore);
  }

  // 점수 분포 업데이트
  this.updateScoreDistribution(accuracy);

  // 시간 통계 업데이트
  if (testResult.timeSpent) {
    this.updateTimeStats(testResult.timeSpent);
  }

  // 문제별 통계 업데이트
  this.updateQuestionStats(testResult.answers, template);

  // 난이도별/단원별/유형별 통계 업데이트
  this.updateCategoryStats(testResult.answers, template);

  this.lastUpdated = new Date();
};

// 점수 분포 업데이트
TestStatisticsSchema.methods.updateScoreDistribution = function(accuracy) {
  const rangeIndex = Math.min(Math.floor(accuracy / 10), 9);
  this.scoreDistribution[rangeIndex].count++;

  // 백분율 재계산
  this.scoreDistribution.forEach(range => {
    range.percentage = Math.round((range.count / this.totalAttempts) * 100);
  });
};

// 시간 통계 업데이트
TestStatisticsSchema.methods.updateTimeStats = function(timeSpent) {
  const timeInMinutes = timeSpent;

  // 평균 시간 계산
  this.timeStats.averageTestTime = Math.round(
    ((this.timeStats.averageTestTime * (this.totalAttempts - 1)) + timeInMinutes) / this.totalAttempts
  );

  // 최단/최장 시간 업데이트
  if (this.totalAttempts === 1) {
    this.timeStats.fastestTime = this.timeStats.slowestTime = timeInMinutes;
  } else {
    this.timeStats.fastestTime = Math.min(this.timeStats.fastestTime, timeInMinutes);
    this.timeStats.slowestTime = Math.max(this.timeStats.slowestTime, timeInMinutes);
  }

  // 시간 분포 업데이트
  let rangeIndex;
  if (timeInMinutes <= 30) rangeIndex = 0;
  else if (timeInMinutes <= 60) rangeIndex = 1;
  else if (timeInMinutes <= 90) rangeIndex = 2;
  else rangeIndex = 3;

  this.timeStats.timeDistribution[rangeIndex].count++;

  // 백분율 재계산
  this.timeStats.timeDistribution.forEach(range => {
    range.percentage = Math.round((range.count / this.totalAttempts) * 100);
  });
};

// 문제별 통계 업데이트
TestStatisticsSchema.methods.updateQuestionStats = function(answers, template) {
  answers.forEach(answer => {
    const question = template.questions.find(q => q.questionNumber === answer.questionNumber);
    if (!question) return;

    let questionStat = this.questionStats.find(qs => qs.questionNumber === answer.questionNumber);

    if (!questionStat) {
      questionStat = {
        questionNumber: answer.questionNumber,
        difficulty: question.difficulty,
        chapter: question.chapter,
        questionType: question.questionType,
        totalAttempts: 0,
        correctCount: 0,
        accuracy: 0,
        avgTimeSpent: 0
      };
      this.questionStats.push(questionStat);
    }

    questionStat.totalAttempts++;
    if (answer.isCorrect) questionStat.correctCount++;

    questionStat.accuracy = Math.round((questionStat.correctCount / questionStat.totalAttempts) * 100);
    questionStat.lastUpdated = new Date();
  });
};

// 카테고리별 통계 업데이트
TestStatisticsSchema.methods.updateCategoryStats = function(answers, template) {
  answers.forEach(answer => {
    const question = template.questions.find(q => q.questionNumber === answer.questionNumber);
    if (!question) return;

    // 난이도별 통계
    const diffStat = this.difficultyStats[question.difficulty];
    if (diffStat) {
      diffStat.totalAttempts++;
      if (answer.isCorrect) diffStat.correctCount++;
      diffStat.averageAccuracy = Math.round((diffStat.correctCount / diffStat.totalAttempts) * 100);
    }

    // 단원별 통계
    let chapterStat = this.chapterStats.find(cs => cs.chapterName === question.chapter);
    if (!chapterStat) {
      chapterStat = {
        chapterId: question.chapter, // TODO: chapterId 매핑 필요
        chapterName: question.chapter,
        totalQuestions: 0,
        averageAccuracy: 0,
        totalAttempts: 0,
        correctCount: 0
      };
      this.chapterStats.push(chapterStat);
    }

    chapterStat.totalAttempts++;
    if (answer.isCorrect) chapterStat.correctCount++;
    chapterStat.averageAccuracy = Math.round((chapterStat.correctCount / chapterStat.totalAttempts) * 100);

    // 유형별 통계
    let typeStat = this.typeStats.find(ts =>
      ts.chapterName === question.chapter && ts.typeName === question.questionType
    );
    if (!typeStat) {
      typeStat = {
        chapterId: question.chapter, // TODO: chapterId 매핑 필요
        chapterName: question.chapter,
        typeId: question.questionType, // TODO: typeId 매핑 필요
        typeName: question.questionType,
        totalQuestions: 0,
        averageAccuracy: 0,
        totalAttempts: 0,
        correctCount: 0
      };
      this.typeStats.push(typeStat);
    }

    typeStat.totalAttempts++;
    if (answer.isCorrect) typeStat.correctCount++;
    typeStat.averageAccuracy = Math.round((typeStat.correctCount / typeStat.totalAttempts) * 100);
  });
};

// 표준편차 계산 메서드 (별도 호출 필요)
TestStatisticsSchema.methods.calculateStandardDeviation = async function() {
  const TestResult = require('./TestResult');

  const results = await TestResult.find({ testTemplateId: this.testTemplateId });
  if (results.length < 2) {
    this.standardDeviation = 0;
    return;
  }

  const scores = results.map(r => r.totalScore);
  const mean = this.averageScore;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;

  this.standardDeviation = Math.round(Math.sqrt(variance) * 100) / 100;
};

module.exports = mongoose.model('TestStatistics', TestStatisticsSchema);