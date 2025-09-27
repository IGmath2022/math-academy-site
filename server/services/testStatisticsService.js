const TestStatistics = require('../models/TestStatistics');
const TestTemplate = require('../models/TestTemplate');
const TestResult = require('../models/TestResult');

class TestStatisticsService {
  /**
   * 테스트 결과 추가 시 통계 업데이트
   * @param {Object} testResult - 테스트 결과 데이터
   */
  static async updateTestStatistics(testResult) {
    try {
      const { testTemplateId } = testResult;

      // 테스트 템플릿 정보 조회
      const template = await TestTemplate.findById(testTemplateId);
      if (!template) {
        throw new Error('테스트 템플릿을 찾을 수 없습니다.');
      }

      // 테스트 통계 조회 또는 생성
      let statistics = await TestStatistics.findOne({ testTemplateId });

      if (!statistics) {
        statistics = new TestStatistics({
          testTemplateId,
          testName: template.name,
          courseId: template.courseId,
          subject: template.subject,
          questionStats: []
        });

        // 초기화
        statistics.initializeScoreDistribution();
        statistics.initializeTimeDistribution();

        // 난이도별 문제 수 계산
        template.questions.forEach(question => {
          if (statistics.difficultyStats[question.difficulty]) {
            statistics.difficultyStats[question.difficulty].totalQuestions++;
          }
        });
      }

      // 테스트 결과 추가
      statistics.addTestResult(testResult, template);

      // 표준편차 재계산 (성능을 위해 주기적으로만 계산)
      if (statistics.totalAttempts % 5 === 0) {
        await statistics.calculateStandardDeviation();
      }

      await statistics.save();

      return statistics;
    } catch (error) {
      console.error('테스트 통계 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 테스트별 통계 조회
   * @param {String} testTemplateId - 테스트 템플릿 ID
   */
  static async getTestStatistics(testTemplateId) {
    try {
      const statistics = await TestStatistics.findOne({ testTemplateId })
        .populate('testTemplateId', 'name subject courseId');

      return statistics;
    } catch (error) {
      console.error('테스트 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 교육과정별 테스트 통계 목록
   * @param {String} courseId - 교육과정 ID
   */
  static async getCourseTestStatistics(courseId) {
    try {
      const statistics = await TestStatistics.find({ courseId })
        .populate('testTemplateId', 'name subject totalQuestions totalPoints')
        .sort({ lastUpdated: -1 });

      return statistics.map(stat => ({
        testTemplateId: stat.testTemplateId._id,
        testName: stat.testName,
        totalQuestions: stat.testTemplateId.totalQuestions,
        totalPoints: stat.testTemplateId.totalPoints,
        totalAttempts: stat.totalAttempts,
        averageScore: stat.averageScore,
        averageAccuracy: stat.averageAccuracy,
        maxScore: stat.maxScore,
        minScore: stat.minScore,
        lastUpdated: stat.lastUpdated
      }));
    } catch (error) {
      console.error('교육과정별 테스트 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 문제별 정답률 분석
   * @param {String} testTemplateId - 테스트 템플릿 ID
   */
  static async getQuestionAnalysis(testTemplateId) {
    try {
      const statistics = await TestStatistics.findOne({ testTemplateId });
      if (!statistics) return null;

      // 문제별 정답률 정렬 (낮은 순)
      const questionStats = statistics.questionStats
        .sort((a, b) => a.accuracy - b.accuracy)
        .map(q => ({
          questionNumber: q.questionNumber,
          difficulty: q.difficulty,
          chapter: q.chapter,
          questionType: q.questionType,
          accuracy: q.accuracy,
          totalAttempts: q.totalAttempts,
          correctCount: q.correctCount,
          level: this.getQuestionDifficultyLevel(q.accuracy)
        }));

      // 가장 어려운 문제 TOP 5
      const hardestQuestions = questionStats.slice(0, 5);

      // 가장 쉬운 문제 TOP 5
      const easiestQuestions = questionStats.slice(-5).reverse();

      return {
        testTemplateId,
        totalQuestions: questionStats.length,
        questionStats,
        hardestQuestions,
        easiestQuestions,
        summary: {
          averageAccuracy: Math.round(
            questionStats.reduce((sum, q) => sum + q.accuracy, 0) / questionStats.length
          ),
          questionsBelow50: questionStats.filter(q => q.accuracy < 50).length,
          questionsBelow70: questionStats.filter(q => q.accuracy < 70).length,
          questionsAbove90: questionStats.filter(q => q.accuracy > 90).length
        }
      };
    } catch (error) {
      console.error('문제별 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 단원별/유형별 통계 분석
   * @param {String} testTemplateId - 테스트 템플릿 ID
   */
  static async getCategoryAnalysis(testTemplateId) {
    try {
      const statistics = await TestStatistics.findOne({ testTemplateId });
      if (!statistics) return null;

      // 단원별 통계
      const chapterAnalysis = statistics.chapterStats
        .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
        .map(chapter => ({
          ...chapter.toObject(),
          level: this.getAccuracyLevel(chapter.averageAccuracy),
          strengthLevel: this.getStrengthLevel(chapter.averageAccuracy)
        }));

      // 유형별 통계
      const typeAnalysis = statistics.typeStats
        .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
        .map(type => ({
          ...type.toObject(),
          level: this.getAccuracyLevel(type.averageAccuracy),
          strengthLevel: this.getStrengthLevel(type.averageAccuracy)
        }));

      // 난이도별 통계
      const difficultyAnalysis = Object.entries(statistics.difficultyStats).map(([diff, stat]) => ({
        difficulty: diff,
        ...stat,
        level: this.getAccuracyLevel(stat.averageAccuracy),
        strengthLevel: this.getStrengthLevel(stat.averageAccuracy)
      }));

      return {
        testTemplateId,
        chapterAnalysis,
        typeAnalysis,
        difficultyAnalysis,
        insights: this.generateInsights(chapterAnalysis, typeAnalysis, difficultyAnalysis)
      };
    } catch (error) {
      console.error('카테고리별 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 시간별 분석
   * @param {String} testTemplateId - 테스트 템플릿 ID
   */
  static async getTimeAnalysis(testTemplateId) {
    try {
      const statistics = await TestStatistics.findOne({ testTemplateId });
      if (!statistics) return null;

      return {
        testTemplateId,
        averageTestTime: statistics.timeStats.averageTestTime,
        fastestTime: statistics.timeStats.fastestTime,
        slowestTime: statistics.timeStats.slowestTime,
        timeDistribution: statistics.timeStats.timeDistribution,
        recommendations: this.generateTimeRecommendations(statistics.timeStats)
      };
    } catch (error) {
      console.error('시간별 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 종합 대시보드 데이터
   * @param {String} courseId - 교육과정 ID
   */
  static async getDashboardData(courseId) {
    try {
      const allStats = await TestStatistics.find({ courseId })
        .populate('testTemplateId', 'name totalQuestions');

      if (allStats.length === 0) {
        return {
          courseId,
          totalTests: 0,
          totalAttempts: 0,
          overallSummary: null
        };
      }

      // 전체 통계 계산
      const totalAttempts = allStats.reduce((sum, stat) => sum + stat.totalAttempts, 0);
      const avgAccuracy = Math.round(
        allStats.reduce((sum, stat) => sum + (stat.averageAccuracy * stat.totalAttempts), 0) / totalAttempts
      );

      // 최근 테스트들
      const recentTests = allStats
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 5)
        .map(stat => ({
          testName: stat.testName,
          totalAttempts: stat.totalAttempts,
          averageAccuracy: stat.averageAccuracy,
          lastUpdated: stat.lastUpdated
        }));

      // 전체 단원별 통계 (중복 제거)
      const chapterMap = new Map();
      allStats.forEach(stat => {
        stat.chapterStats.forEach(chapter => {
          const key = chapter.chapterName;
          if (!chapterMap.has(key)) {
            chapterMap.set(key, {
              chapterName: chapter.chapterName,
              totalAttempts: 0,
              correctCount: 0,
              averageAccuracy: 0
            });
          }
          const existing = chapterMap.get(key);
          existing.totalAttempts += chapter.totalAttempts;
          existing.correctCount += chapter.correctCount;
        });
      });

      const overallChapterStats = Array.from(chapterMap.values()).map(chapter => ({
        ...chapter,
        averageAccuracy: chapter.totalAttempts > 0
          ? Math.round((chapter.correctCount / chapter.totalAttempts) * 100)
          : 0
      }));

      return {
        courseId,
        totalTests: allStats.length,
        totalAttempts,
        overallSummary: {
          averageAccuracy: avgAccuracy,
          recentTests,
          chapterPerformance: overallChapterStats
            .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
            .slice(0, 10)
        }
      };
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
      throw error;
    }
  }

  // 유틸리티 메서드들
  static getQuestionDifficultyLevel(accuracy) {
    if (accuracy >= 90) return '매우 쉬움';
    if (accuracy >= 70) return '쉬움';
    if (accuracy >= 50) return '보통';
    if (accuracy >= 30) return '어려움';
    return '매우 어려움';
  }

  static getAccuracyLevel(accuracy) {
    if (accuracy >= 90) return '잘 안다';
    if (accuracy >= 70) return '보통';
    if (accuracy >= 50) return '미흡';
    return '많이 미흡';
  }

  static getStrengthLevel(accuracy) {
    if (accuracy >= 90) return 'strength';
    if (accuracy >= 70) return 'average';
    if (accuracy >= 50) return 'weakness';
    return 'critical';
  }

  static generateInsights(chapterAnalysis, typeAnalysis, difficultyAnalysis) {
    const insights = [];

    // 가장 약한 단원
    if (chapterAnalysis.length > 0) {
      const weakestChapter = chapterAnalysis[0];
      if (weakestChapter.averageAccuracy < 70) {
        insights.push({
          type: 'weakness',
          title: '취약 단원 발견',
          description: `${weakestChapter.chapterName} 단원의 정답률이 ${weakestChapter.averageAccuracy}%로 가장 낮습니다.`,
          recommendation: '해당 단원의 기본 개념 복습이 필요합니다.'
        });
      }
    }

    // 난이도별 특이사항
    const hardDiff = difficultyAnalysis.find(d => d.difficulty === '상');
    const easyDiff = difficultyAnalysis.find(d => d.difficulty === '하');

    if (hardDiff && easyDiff && hardDiff.averageAccuracy > easyDiff.averageAccuracy) {
      insights.push({
        type: 'anomaly',
        title: '난이도별 정답률 역전',
        description: '어려운 문제의 정답률이 쉬운 문제보다 높습니다.',
        recommendation: '쉬운 문제에서의 실수를 줄이는 연습이 필요합니다.'
      });
    }

    return insights;
  }

  static generateTimeRecommendations(timeStats) {
    const recommendations = [];

    if (timeStats.averageTestTime > 90) {
      recommendations.push({
        type: 'time',
        title: '시간 관리 개선 필요',
        description: `평균 시험 시간이 ${timeStats.averageTestTime}분으로 길어 시간 관리 연습이 필요합니다.`
      });
    }

    const fastFinishers = timeStats.timeDistribution.find(d => d.range === "0-30분");
    if (fastFinishers && fastFinishers.percentage > 30) {
      recommendations.push({
        type: 'review',
        title: '검토 시간 확보',
        description: '30분 이내에 완료하는 학생들이 많아 검토 시간을 늘릴 수 있습니다.'
      });
    }

    return recommendations;
  }
}

module.exports = TestStatisticsService;