const StudentAnalysis = require('../models/StudentAnalysis');
const TestTemplate = require('../models/TestTemplate');
const Curriculum = require('../models/Curriculum');

class AnalysisService {
  /**
   * ?뚯뒪??寃곌낵瑜?湲곕컲?쇰줈 ?숈깮 遺꾩꽍 ?곗씠???낅뜲?댄듃
   * @param {Object} testResult - ?뚯뒪??寃곌낵 ?곗씠??
   */
  static async updateStudentAnalysis(testResult) {
    try {
      const { studentId, testTemplateId, totalScore, totalPossibleScore, answers } = testResult;

      // ?뚯뒪???쒗뵆由??뺣낫 議고쉶
      const template = await TestTemplate.findById(testTemplateId);
      if (!template) {
        throw new Error('?뚯뒪???쒗뵆由우쓣 李얠쓣 ???놁뒿?덈떎.');
      }

      // 援먯쑁怨쇱젙 ?뺣낫 議고쉶
      const curriculum = await Curriculum.findOne({ courseId: template.courseId });
      if (!curriculum) {
        console.warn(`援먯쑁怨쇱젙??李얠쓣 ???놁뒿?덈떎: ${template.courseId}`);
      }

      // ?숈깮 遺꾩꽍 ?곗씠??議고쉶 ?먮뒗 ?앹꽦
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

      // ?꾩껜 ?듦퀎 ?낅뜲?댄듃
      analysis.totalTests++;
      analysis.totalQuestions += answers.length;

      let correctCount = 0;

      // 臾명빆蹂?遺꾩꽍 泥섎━
      for (const answer of answers) {
        const question = template.questions.find(q => q.questionNumber === answer.questionNumber);
        if (!question) continue;

        const isCorrect = answer.isCorrect;
        if (isCorrect) {
          correctCount++;
          analysis.totalCorrect++;
        }

        // ?⑥썝蹂?遺꾩꽍 ?낅뜲?댄듃
        if (question.chapter) {
          analysis.updateChapterAnalysis(
            this.getChapterIdFromName(curriculum, question.chapter),
            question.chapter,
            isCorrect
          );
        }

        // ?좏삎蹂?遺꾩꽍 ?낅뜲?댄듃
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

        // ?쒖씠?꾨퀎 遺꾩꽍 ?낅뜲?댄듃
        if (question.difficulty) {
          analysis.updateDifficultyAnalysis(question.difficulty, isCorrect);
        }
      }

      // 理쒓렐 ?깆쟻 異붽?
      analysis.addRecentScore({
        testId: testTemplateId,
        testName: template.name,
        score: totalScore,
        totalScore: totalPossibleScore,
        accuracy: Math.round((correctCount / answers.length) * 100),
        testDate: new Date()
      });

      // ?꾩껜 ?듦퀎 ?ш퀎??
      analysis.updateOverallStats();

      // ???
      await analysis.save();

      return analysis;
    } catch (error) {
      console.error('?숈깮 遺꾩꽍 ?곗씠???낅뜲?댄듃 ?ㅽ뙣:', error);
      throw error;
    }
  }

  /**
   * ?⑥썝紐낆쑝濡쒕????⑥썝 ID 李얘린
   */
  static getChapterIdFromName(curriculum, chapterName) {
    if (!curriculum?.chapters) return chapterName;

    const chapter = curriculum.chapters.find(c => c.chapterName === chapterName);
    return chapter?.chapterId || chapterName;
  }

  /**
   * ?좏삎紐낆쑝濡쒕????좏삎 ID 李얘린
   */
  static getTypeIdFromName(curriculum, chapterId, typeName) {
    if (!curriculum?.chapters) return typeName;

    const chapter = curriculum.chapters.find(c => c.chapterId === chapterId);
    if (!chapter?.types) return typeName;

    const type = chapter.types.find(t => t.typeName === typeName);
    return type?.typeId || typeName;
  }

  /**
   * ?숈깮??遺꾩꽍 ?곗씠??議고쉶
   * @param {String} studentId - ?숈깮 ID
   * @param {String} courseId - 援먯쑁怨쇱젙 ID (?좏깮)
   */

  static async getStudentAnalysisSummary(studentId) {
    try {
      const summaries = await StudentAnalysis.find({ studentId })
        .select('courseId courseName overallAccuracy totalTests totalQuestions lastUpdated recentScores')
        .sort({ lastUpdated: -1 })
        .lean();

      return summaries.map((item) => ({
        courseId: item.courseId,
        courseName: item.courseName,
        overallAccuracy: item.overallAccuracy,
        totalTests: item.totalTests,
        totalQuestions: item.totalQuestions,
        lastUpdated: item.lastUpdated,
        recentScore: Array.isArray(item.recentScores) && item.recentScores.length > 0 ? item.recentScores[0] : null,
      }));
    } catch (error) {
      console.error('[AnalysisService] Failed to load student analysis summary:', error);
      throw error;
    }
  }

  static async getStudentAnalysisDetail(studentId, courseId) {
    try {
      return await StudentAnalysis.findOne({ studentId, courseId }).lean();
    } catch (error) {
      console.error('[AnalysisService] Failed to load student analysis detail:', error);
      throw error;
    }
  }

  static async getStudentAnalysis(studentId, courseId = null) {
    try {
      const query = { studentId };
      if (courseId) query.courseId = courseId;

      const analyses = await StudentAnalysis.find(query)
        .populate('studentId', 'name')
        .sort({ lastUpdated: -1 });

      return analyses;
    } catch (error) {
      console.error('?숈깮 遺꾩꽍 ?곗씠??議고쉶 ?ㅽ뙣:', error);
      throw error;
    }
  }

  /**
   * ?뱀젙 援먯쑁怨쇱젙???숈깮 ?쒖쐞 怨꾩궛
   * @param {String} courseId - 援먯쑁怨쇱젙 ID
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
      console.error('?숈깮 ?쒖쐞 怨꾩궛 ?ㅽ뙣:', error);
      throw error;
    }
  }

  /**
   * ?⑥썝蹂??좏삎蹂??쎌젏 遺꾩꽍
   * @param {String} studentId - ?숈깮 ID
   * @param {String} courseId - 援먯쑁怨쇱젙 ID
   */
  static async getWeaknessAnalysis(studentId, courseId) {
    try {
      const analysis = await StudentAnalysis.findOne({ studentId, courseId });
      if (!analysis) return null;

      // ?쎌젏 ?⑥썝 (?뺣떟瑜?70% 誘몃쭔)
      const weakChapters = analysis.chapterAnalysis
        .filter(c => c.accuracy < 70 && c.totalQuestions >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      // ?쎌젏 ?좏삎 (?뺣떟瑜?70% 誘몃쭔)
      const weakTypes = analysis.typeAnalysis
        .filter(t => t.accuracy < 70 && t.totalQuestions >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      // 媛뺤젏 ?⑥썝 (?뺣떟瑜?90% ?댁긽)
      const strongChapters = analysis.chapterAnalysis
        .filter(c => c.accuracy >= 90 && c.totalQuestions >= 3)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5);

      // 媛쒖꽑 異붿씠 遺꾩꽍 (理쒓렐 5???뚯뒪??
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
   * ?숈뒿 異붿쿇?ы빆 ?앹꽦
   */
  static generateRecommendations(weakChapters, weakTypes) {
    const recommendations = [];

    if (weakChapters.length > 0) {
      const worstChapter = weakChapters[0];
      recommendations.push({
        type: 'chapter',
        priority: 'high',
        title: `${worstChapter.chapterName} ?⑥썝 吏묒쨷 ?숈뒿`,
        description: `?뺣떟瑜?${worstChapter.accuracy}%濡?媛??痍⑥빟???⑥썝?낅땲?? 湲곕낯 媛쒕뀗遺??李④렐李④렐 蹂듭뒿?섏꽭??`,
        target: worstChapter.chapterName
      });
    }

    if (weakTypes.length > 0) {
      const worstType = weakTypes[0];
      recommendations.push({
        type: 'type',
        priority: 'medium',
        title: `${worstType.typeName} ?좏삎 臾몄젣 ?곗뒿`,
        description: `${worstType.chapterName} ?⑥썝??${worstType.typeName} ?좏삎?먯꽌 ?뺣떟瑜?${worstType.accuracy}%?낅땲?? ?좎궗 臾몄젣瑜?????대낫?몄슂.`,
        target: worstType.typeName
      });
    }

    // ?쇰컲?곸씤 異붿쿇?ы빆
    if (weakChapters.length > 2) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        title: '湲곕낯 媛쒕뀗 ?뺣━',
        description: '?щ윭 ?⑥썝?먯꽌 ?쎌젏??諛쒓껄?섏뿀?듬땲?? ?꾩껜?곸씤 湲곕낯 媛쒕뀗???ㅼ떆 ?뺣━?대낫?몄슂.',
        target: 'overall'
      });
    }

    return recommendations;
  }

  /**
   * 援먯쑁怨쇱젙蹂??꾩껜 ?듦퀎
   * @param {String} courseId - 援먯쑁怨쇱젙 ID
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

      // ?꾩껜 ?됯퇏 ?뺣떟瑜?
      const totalAccuracy = analyses.reduce((sum, a) => sum + a.overallAccuracy, 0);
      const averageAccuracy = Math.round(totalAccuracy / analyses.length);

      // ?⑥썝蹂??듦퀎
      const chapterStats = this.aggregateChapterStats(analyses);

      // ?좏삎蹂??듦퀎
      const typeStats = this.aggregateTypeStats(analyses);

      // ?쒖씠?꾨퀎 ?듦퀎
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
      console.error('援먯쑁怨쇱젙 ?듦퀎 怨꾩궛 ?ㅽ뙣:', error);
      throw error;
    }
  }

  /**
   * ?⑥썝蹂??듦퀎 吏묎퀎
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
   * ?좏삎蹂??듦퀎 吏묎퀎
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
   * ?쒖씠?꾨퀎 ?듦퀎 吏묎퀎
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
