const StudentAnalysis = require('../models/StudentAnalysis');
const TestTemplate = require('../models/TestTemplate');
const Curriculum = require('../models/Curriculum');

class AnalysisService {
  /**
   * 테스트 결과를 기반으로 학생 분석 데이터 업데이트
   * @param {Object} testResult - 테스트 결과 데이터
   */
  static async updateStudentAnalysis(testResult) {
    try {
      const { studentId, testTemplateId, totalScore, totalPossibleScore, answers } = testResult;

      // 테스트 템플릿 정보 조회
      const template = await TestTemplate.findById(testTemplateId);
      if (!template) {
        throw new Error('테스트 템플릿을 찾을 수 없습니다.');
      }

      // 교육과정 정보 조회
      const curriculum = await Curriculum.findOne({ courseId: template.courseId });
      if (!curriculum) {
        console.warn(`교육과정을 찾을 수 없습니다: ${template.courseId}`);
      }

      // 학생 분석 데이터 조회 또는 생성
      let analysis = await StudentAnalysis.findOne({
        studentId,
        courseId: template.courseId
      });

      if (!analysis) {
        analysis = new StudentAnalysis({
          studentId,
          courseId: template.courseId,
          courseName: curriculum?.courseName || template.courseId,
          chapterAnalysis: [],
          typeAnalysis: [],
          difficultyAnalysis: [],
          recentScores: []
        });
      }

      // 전체 통계 업데이트
      analysis.totalTests++;
      analysis.totalQuestions += answers.length;

      let correctCount = 0;

      // 문항별 분석 처리
      for (const answer of answers) {
        const question = template.questions.find(q => q.questionNumber === answer.questionNumber);
        if (!question) continue;

        const isCorrect = answer.isCorrect;
        if (isCorrect) {
          correctCount++;
          analysis.totalCorrect++;
        }

        // 단원별 분석 업데이트
        if (question.chapter) {
          analysis.updateChapterAnalysis(
            this.getChapterIdFromName(curriculum, question.chapter),
            question.chapter,
            isCorrect
          );
        }

        // 유형별 분석 업데이트
        if (question.chapter && question.questionType) {
          const chapterId = this.getChapterIdFromName(curriculum, question.chapter);
          const typeId = this.getTypeIdFromName(curriculum, chapterId, question.questionType);

          analysis.updateTypeAnalysis(
            chapterId,
            question.chapter,
            typeId,
            question.questionType,
            isCorrect
          );
        }

        // 난이도별 분석 업데이트
        if (question.difficulty) {
          analysis.updateDifficultyAnalysis(question.difficulty, isCorrect);
        }
      }

      // 최근 성적 추가
      analysis.addRecentScore({
        testId: testTemplateId,
        testName: template.name,
        score: totalScore,
        totalScore: totalPossibleScore,
        accuracy: Math.round((correctCount / answers.length) * 100),
        testDate: new Date()
      });

      // 전체 통계 재계산
      analysis.updateOverallStats();

      // 저장
      await analysis.save();

      return analysis;
    } catch (error) {
      console.error('학생 분석 데이터 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 단원명으로부터 단원 ID 찾기
   */
  static getChapterIdFromName(curriculum, chapterName) {
    if (!curriculum?.chapters) return chapterName;

    const chapter = curriculum.chapters.find(c => c.chapterName === chapterName);
    return chapter?.chapterId || chapterName;
  }

  /**
   * 유형명으로부터 유형 ID 찾기
   */
  static getTypeIdFromName(curriculum, chapterId, typeName) {
    if (!curriculum?.chapters) return typeName;

    const chapter = curriculum.chapters.find(c => c.chapterId === chapterId);
    if (!chapter?.types) return typeName;

    const type = chapter.types.find(t => t.typeName === typeName);
    return type?.typeId || typeName;
  }

  /**
   * 학생의 분석 데이터 조회
   * @param {String} studentId - 학생 ID
   * @param {String} courseId - 교육과정 ID (선택)
   */
  static async getStudentAnalysis(studentId, courseId = null) {
    try {
      const query = { studentId };
      if (courseId) query.courseId = courseId;

      const analyses = await StudentAnalysis.find(query)
        .populate('studentId', 'name')
        .sort({ lastUpdated: -1 });

      return analyses;
    } catch (error) {
      console.error('학생 분석 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 교육과정의 학생 순위 계산
   * @param {String} courseId - 교육과정 ID
   */
  static async calculateStudentRankings(courseId) {
    try {
      const analyses = await StudentAnalysis.find({ courseId })
        .populate('studentId', 'name')
        .sort({ overallAccuracy: -1 });

      return analyses.map((analysis, index) => ({
        rank: index + 1,
        studentId: analysis.studentId._id,
        studentName: analysis.studentId.name,
        overallAccuracy: analysis.overallAccuracy,
        totalTests: analysis.totalTests,
        totalQuestions: analysis.totalQuestions,
        percentile: Math.round(((analyses.length - index) / analyses.length) * 100)
      }));
    } catch (error) {
      console.error('학생 순위 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 단원별/유형별 약점 분석
   * @param {String} studentId - 학생 ID
   * @param {String} courseId - 교육과정 ID
   */
  static async getWeaknessAnalysis(studentId, courseId) {
    try {
      const analysis = await StudentAnalysis.findOne({ studentId, courseId });
      if (!analysis) return null;

      // 약점 단원 (정답률 70% 미만)
      const weakChapters = analysis.chapterAnalysis
        .filter(c => c.accuracy < 70 && c.totalQuestions >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      // 약점 유형 (정답률 70% 미만)
      const weakTypes = analysis.typeAnalysis
        .filter(t => t.accuracy < 70 && t.totalQuestions >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      // 강점 단원 (정답률 90% 이상)
      const strongChapters = analysis.chapterAnalysis
        .filter(c => c.accuracy >= 90 && c.totalQuestions >= 3)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5);

      // 개선 추이 분석 (최근 5회 테스트)
      const recentTrend = analysis.recentScores.slice(0, 5).map(score => ({
        testName: score.testName,
        accuracy: score.accuracy,
        testDate: score.testDate
      }));

      return {
        studentId,
        courseId,
        overallAccuracy: analysis.overallAccuracy,
        weakChapters,
        weakTypes,
        strongChapters,
        recentTrend,
        recommendations: this.generateRecommendations(weakChapters, weakTypes)
      };
    } catch (error) {
      console.error('약점 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 학습 추천사항 생성
   */
  static generateRecommendations(weakChapters, weakTypes) {
    const recommendations = [];

    if (weakChapters.length > 0) {
      const worstChapter = weakChapters[0];
      recommendations.push({
        type: 'chapter',
        priority: 'high',
        title: `${worstChapter.chapterName} 단원 집중 학습`,
        description: `정답률 ${worstChapter.accuracy}%로 가장 취약한 단원입니다. 기본 개념부터 차근차근 복습하세요.`,
        target: worstChapter.chapterName
      });
    }

    if (weakTypes.length > 0) {
      const worstType = weakTypes[0];
      recommendations.push({
        type: 'type',
        priority: 'medium',
        title: `${worstType.typeName} 유형 문제 연습`,
        description: `${worstType.chapterName} 단원의 ${worstType.typeName} 유형에서 정답률 ${worstType.accuracy}%입니다. 유사 문제를 더 풀어보세요.`,
        target: worstType.typeName
      });
    }

    // 일반적인 추천사항
    if (weakChapters.length > 2) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        title: '기본 개념 정리',
        description: '여러 단원에서 약점이 발견되었습니다. 전체적인 기본 개념을 다시 정리해보세요.',
        target: 'overall'
      });
    }

    return recommendations;
  }

  /**
   * 교육과정별 전체 통계
   * @param {String} courseId - 교육과정 ID
   */
  static async getCourseStatistics(courseId) {
    try {
      const analyses = await StudentAnalysis.find({ courseId });

      if (analyses.length === 0) {
        return {
          courseId,
          totalStudents: 0,
          averageAccuracy: 0,
          chapterStats: [],
          typeStats: [],
          difficultyStats: []
        };
      }

      // 전체 평균 정답률
      const totalAccuracy = analyses.reduce((sum, a) => sum + a.overallAccuracy, 0);
      const averageAccuracy = Math.round(totalAccuracy / analyses.length);

      // 단원별 통계
      const chapterStats = this.aggregateChapterStats(analyses);

      // 유형별 통계
      const typeStats = this.aggregateTypeStats(analyses);

      // 난이도별 통계
      const difficultyStats = this.aggregateDifficultyStats(analyses);

      return {
        courseId,
        totalStudents: analyses.length,
        averageAccuracy,
        chapterStats,
        typeStats,
        difficultyStats
      };
    } catch (error) {
      console.error('교육과정 통계 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 단원별 통계 집계
   */
  static aggregateChapterStats(analyses) {
    const chapterMap = new Map();

    analyses.forEach(analysis => {
      analysis.chapterAnalysis.forEach(chapter => {
        const key = chapter.chapterId;
        if (!chapterMap.has(key)) {
          chapterMap.set(key, {
            chapterId: chapter.chapterId,
            chapterName: chapter.chapterName,
            totalStudents: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            averageAccuracy: 0
          });
        }

        const stat = chapterMap.get(key);
        stat.totalStudents++;
        stat.totalQuestions += chapter.totalQuestions;
        stat.totalCorrect += chapter.correctAnswers;
      });
    });

    return Array.from(chapterMap.values()).map(stat => ({
      ...stat,
      averageAccuracy: stat.totalQuestions > 0
        ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100)
        : 0
    }));
  }

  /**
   * 유형별 통계 집계
   */
  static aggregateTypeStats(analyses) {
    const typeMap = new Map();

    analyses.forEach(analysis => {
      analysis.typeAnalysis.forEach(type => {
        const key = `${type.chapterId}_${type.typeId}`;
        if (!typeMap.has(key)) {
          typeMap.set(key, {
            chapterId: type.chapterId,
            chapterName: type.chapterName,
            typeId: type.typeId,
            typeName: type.typeName,
            totalStudents: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            averageAccuracy: 0
          });
        }

        const stat = typeMap.get(key);
        stat.totalStudents++;
        stat.totalQuestions += type.totalQuestions;
        stat.totalCorrect += type.correctAnswers;
      });
    });

    return Array.from(typeMap.values()).map(stat => ({
      ...stat,
      averageAccuracy: stat.totalQuestions > 0
        ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100)
        : 0
    }));
  }

  /**
   * 난이도별 통계 집계
   */
  static aggregateDifficultyStats(analyses) {
    const difficultyMap = new Map();

    analyses.forEach(analysis => {
      analysis.difficultyAnalysis.forEach(diff => {
        const key = diff.difficulty;
        if (!difficultyMap.has(key)) {
          difficultyMap.set(key, {
            difficulty: diff.difficulty,
            totalStudents: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            averageAccuracy: 0
          });
        }

        const stat = difficultyMap.get(key);
        stat.totalStudents++;
        stat.totalQuestions += diff.totalQuestions;
        stat.totalCorrect += diff.correctAnswers;
      });
    });

    return Array.from(difficultyMap.values()).map(stat => ({
      ...stat,
      averageAccuracy: stat.totalQuestions > 0
        ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100)
        : 0
    }));
  }
}

module.exports = AnalysisService;