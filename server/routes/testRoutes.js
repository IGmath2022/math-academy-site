// server/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const TestTemplate = require('../models/TestTemplate');
const TestResult = require('../models/TestResult');
const AnalysisService = require('../services/analysisService');
const TestStatisticsService = require('../services/testStatisticsService');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 테스트 템플릿 목록 조회
router.get('/templates', isAuthenticated, async (req, res) => {
  try {
    const templates = await TestTemplate.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: '테스트 템플릿 조회 실패', error: error.message });
  }
});

// 테스트 템플릿 생성 (관리자/강사만)
router.post('/templates', isAdmin, async (req, res) => {
  try {
    const { name, subject, courseId, totalQuestions, totalPoints, questions } = req.body;

    const template = new TestTemplate({
      name,
      subject,
      courseId,
      totalQuestions,
      totalPoints,
      questions,
      createdBy: req.user.id
    });

    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: '테스트 템플릿 생성 실패', error: error.message });
  }
});

// 테스트 템플릿 상세 조회
router.get('/templates/:id', isAuthenticated, async (req, res) => {
  try {
    const template = await TestTemplate.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!template) {
      return res.status(404).json({ message: '테스트 템플릿을 찾을 수 없습니다' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: '테스트 템플릿 조회 실패', error: error.message });
  }
});

// 테스트 템플릿 수정
router.put('/templates/:id', isAdmin, async (req, res) => {
  try {
    const { name, subject, courseId, totalQuestions, totalPoints, questions } = req.body;

    const template = await TestTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        subject,
        courseId,
        totalQuestions,
        totalPoints,
        questions
      },
      { new: true }
    ).populate('createdBy', 'name');

    if (!template) {
      return res.status(404).json({ message: '테스트 템플릿을 찾을 수 없습니다' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: '테스트 템플릿 수정 실패', error: error.message });
  }
});

// 테스트 결과 저장
router.post('/results', isAdmin, async (req, res) => {
  try {
    const { studentId, testTemplateId, totalScore, totalPossibleScore, answers, timeSpent, notes } = req.body;

    // 테스트 템플릿 정보 가져오기
    const template = await TestTemplate.findById(testTemplateId);
    if (!template) {
      return res.status(404).json({ message: '테스트 템플릿을 찾을 수 없습니다' });
    }

    // 분석 데이터 자동 계산
    const difficultyStats = { hard: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, easy: { correct: 0, total: 0 } };
    const chapterStats = new Map();
    const typeStats = new Map();

    answers.forEach(answer => {
      const question = template.questions.find(q => q.questionNumber === answer.questionNumber);
      if (question) {
        // 난이도별 통계
        const diffKey = question.difficulty === '상' ? 'hard' : question.difficulty === '중' ? 'medium' : 'easy';
        difficultyStats[diffKey].total++;
        if (answer.isCorrect) difficultyStats[diffKey].correct++;

        // 단원별 통계
        const chapterKey = question.chapter;
        if (!chapterStats.has(chapterKey)) {
          chapterStats.set(chapterKey, { correct: 0, total: 0 });
        }
        chapterStats.get(chapterKey).total++;
        if (answer.isCorrect) chapterStats.get(chapterKey).correct++;

        // 유형별 통계
        const typeKey = question.questionType;
        if (!typeStats.has(typeKey)) {
          typeStats.set(typeKey, { correct: 0, total: 0 });
        }
        typeStats.get(typeKey).total++;
        if (answer.isCorrect) typeStats.get(typeKey).correct++;
      }
    });

    const testResult = new TestResult({
      studentId,
      testTemplateId,
      totalScore,
      totalPossibleScore,
      answers,
      difficultyStats,
      chapterStats: Object.fromEntries(chapterStats),
      typeStats: Object.fromEntries(typeStats),
      timeSpent,
      notes
    });

    await testResult.save();

    // 학생 분석 데이터 업데이트 (비동기 처리)
    try {
      console.log('분석 데이터 업데이트 시작:', { studentId, testTemplateId, totalScore });
      await AnalysisService.updateStudentAnalysis({
        studentId,
        testTemplateId,
        totalScore,
        totalPossibleScore,
        answers
      });
      console.log('분석 데이터 업데이트 완료');
    } catch (analysisError) {
      console.error('분석 데이터 업데이트 실패:', analysisError);
      // 분석 실패해도 테스트 결과 저장은 성공으로 처리
    }

    // 테스트 통계 업데이트 (비동기 처리)
    try {
      await TestStatisticsService.updateTestStatistics(testResult);
    } catch (statisticsError) {
      console.error('테스트 통계 업데이트 실패:', statisticsError);
      // 통계 실패해도 테스트 결과 저장은 성공으로 처리
    }

    res.status(201).json(testResult);
  } catch (error) {
    console.error('테스트 결과 저장 실패:', error);
    res.status(500).json({ message: '테스트 결과 저장 실패', error: error.message });
  }
});

// 전체 테스트 결과 조회 (관리자용)
router.get('/results', isAdmin, async (req, res) => {
  try {
    const results = await TestResult.find()
      .populate('studentId', 'name grade')
      .populate('testTemplateId', 'name subject courseId')
      .sort({ testDate: -1 })
      .limit(100); // 최근 100개만

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: '테스트 결과 조회 실패', error: error.message });
  }
});

// 학생별 테스트 결과 조회
router.get('/results/student/:studentId', isAuthenticated, async (req, res) => {
  try {
    const results = await TestResult.find({ studentId: req.params.studentId })
      .populate('testTemplateId', 'name subject')
      .sort({ testDate: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: '테스트 결과 조회 실패', error: error.message });
  }
});

// 특정 테스트 결과 상세 조회
router.get('/results/:id', isAuthenticated, async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate('studentId', 'name')
      .populate('testTemplateId');

    if (!result) {
      return res.status(404).json({ message: '테스트 결과를 찾을 수 없습니다' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '테스트 결과 조회 실패', error: error.message });
  }
});

// 공개 링크용 학생 테스트 결과 조회 (특정 리포트 코드로)
router.get('/results/public/:reportCode', async (req, res) => {
  try {
    // 리포트 코드는 LessonLog의 _id입니다
    const LessonLog = require('../models/LessonLog');
    const lessonLog = await LessonLog.findById(req.params.reportCode);

    if (!lessonLog || !lessonLog.studentId) {
      return res.status(404).json({ message: '리포트를 찾을 수 없습니다' });
    }

    // 해당 학생의 테스트 결과들 조회
    const results = await TestResult.find({ studentId: lessonLog.studentId })
      .populate('testTemplateId', 'name subject totalQuestions totalPoints')
      .sort({ testDate: -1 })
      .limit(10)
      .lean(); // lean()을 사용하여 Map 필드를 일반 객체로 변환

    console.log(`테스트 결과 조회: 학생 ${lessonLog.studentId}, 결과 ${results.length}개`);

    // 결과 반환 (lean()으로 이미 일반 객체로 변환됨)
    res.json(results);
  } catch (error) {
    console.error('테스트 결과 조회 오류:', error);
    res.status(500).json({ message: '테스트 결과 조회 실패', error: error.message });
  }
});

// 공개 링크용 학생 분석 데이터 조회
// Public: student analysis summary list
router.get('/analysis/public/:reportCode/summary', async (req, res) => {
  try {
    const LessonLog = require('../models/LessonLog');
    const lessonLog = await LessonLog.findById(req.params.reportCode);

    if (!lessonLog || !lessonLog.studentId) {
      return res.status(404).json({ message: 'Report link not found.' });
    }

    const summaries = await AnalysisService.getStudentAnalysisSummary(lessonLog.studentId);
    res.json({ summaries });
  } catch (error) {
    console.error('Public student analysis summary failed:', error);
    res.status(500).json({ message: 'Failed to load analysis summary', error: error.message });
  }
});

// Public: student analysis detail per course
router.get('/analysis/public/:reportCode/course/:courseId', async (req, res) => {
  try {
    const LessonLog = require('../models/LessonLog');
    const { reportCode, courseId } = req.params;
    const lessonLog = await LessonLog.findById(reportCode);

    if (!lessonLog || !lessonLog.studentId) {
      return res.status(404).json({ message: 'Report link not found.' });
    }

    const analysis = await AnalysisService.getStudentAnalysisDetail(lessonLog.studentId, courseId);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis data not found.' });
    }

    const weakness = await AnalysisService.getWeaknessAnalysis(lessonLog.studentId, courseId);

    res.json({ analysis, weakness });
  } catch (error) {
    console.error('Public student analysis detail failed:', error);
    res.status(500).json({ message: 'Failed to load analysis data', error: error.message });
  }
});

router.get('/analysis/public/:reportCode', async (req, res) => {
  try {
    // 리포트 코드는 LessonLog의 _id입니다
    const LessonLog = require('../models/LessonLog');
    const lessonLog = await LessonLog.findById(req.params.reportCode);

    if (!lessonLog || !lessonLog.studentId) {
      return res.status(404).json({ message: '리포트를 찾을 수 없습니다' });
    }

    // 해당 학생의 분석 데이터 조회
    const analysisData = await AnalysisService.getStudentAnalysis(lessonLog.studentId);

    // 약점 분석도 추가
    const weaknessData = await Promise.all(
      analysisData.map(async (analysis) => {
        try {
          return await AnalysisService.getWeaknessAnalysis(lessonLog.studentId, analysis.courseId);
        } catch (error) {
          console.error('약점 분석 조회 실패:', error);
          return null;
        }
      })
    );

    console.log(`학생 분석 데이터 조회: 학생 ${lessonLog.studentId}, 분석 ${analysisData.length}개`);

    res.json({
      analysis: analysisData,
      weakness: weaknessData.filter(w => w !== null)
    });
  } catch (error) {
    console.error('학생 분석 데이터 조회 오류:', error);
    res.status(500).json({ message: '분석 데이터 조회 실패', error: error.message });
  }
});

// 공개 링크용 테스트 통계 조회
router.get('/statistics/public/:reportCode/:testTemplateId', async (req, res) => {
  try {
    // 리포트 코드는 LessonLog의 _id입니다
    const LessonLog = require('../models/LessonLog');
    const lessonLog = await LessonLog.findById(req.params.reportCode);

    if (!lessonLog || !lessonLog.studentId) {
      return res.status(404).json({ message: '리포트를 찾을 수 없습니다' });
    }

    const { testTemplateId } = req.params;

    // 테스트 통계 조회
    const statistics = await TestStatisticsService.getTestStatistics(testTemplateId);
    if (!statistics) {
      return res.status(404).json({ message: '테스트 통계를 찾을 수 없습니다' });
    }

    // 해당 학생의 해당 테스트 결과 조회
    const studentResult = await TestResult.findOne({
      studentId: lessonLog.studentId,
      testTemplateId: testTemplateId
    }).populate('testTemplateId', 'name subject');

    // 상대적 위치 계산
    let percentile = null;
    if (studentResult && statistics.scoreDistribution) {
      const studentScore = studentResult.totalScore;
      let lowerCount = 0;

      Object.entries(statistics.scoreDistribution).forEach(([range, count]) => {
        const [min] = range.split('-').map(Number);
        if (min < studentScore) {
          lowerCount += count;
        }
      });

      percentile = Math.round((lowerCount / statistics.totalAttempts) * 100);
    }

    console.log(`테스트 통계 조회: 학생 ${lessonLog.studentId}, 테스트 ${testTemplateId}`);

    res.json({
      statistics,
      studentResult,
      percentile
    });
  } catch (error) {
    console.error('테스트 통계 조회 오류:', error);
    res.status(500).json({ message: '테스트 통계 조회 실패', error: error.message });
  }
});

// 학생 분석 데이터 조회
router.get('/analysis/student/:studentId', isAuthenticated, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    const analyses = await AnalysisService.getStudentAnalysis(studentId, courseId);
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: '학생 분석 데이터 조회 실패', error: error.message });
  }
});

// 학생 약점 분석
router.get('/analysis/weakness/:studentId/:courseId', isAuthenticated, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const weakness = await AnalysisService.getWeaknessAnalysis(studentId, courseId);
    if (!weakness) {
      return res.status(404).json({ message: '분석 데이터를 찾을 수 없습니다' });
    }

    res.json(weakness);
  } catch (error) {
    res.status(500).json({ message: '약점 분석 실패', error: error.message });
  }
});

// 교육과정별 학생 순위
router.get('/analysis/rankings/:courseId', isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.params;

    const rankings = await AnalysisService.calculateStudentRankings(courseId);
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: '순위 계산 실패', error: error.message });
  }
});

// 교육과정별 전체 통계
router.get('/analysis/course-stats/:courseId', isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.params;

    const stats = await AnalysisService.getCourseStatistics(courseId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: '교육과정 통계 조회 실패', error: error.message });
  }
});

// 테스트별 통계 조회
router.get('/statistics/:testTemplateId', isAuthenticated, async (req, res) => {
  try {
    const { testTemplateId } = req.params;

    const statistics = await TestStatisticsService.getTestStatistics(testTemplateId);
    if (!statistics) {
      return res.status(404).json({ message: '테스트 통계를 찾을 수 없습니다' });
    }

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: '테스트 통계 조회 실패', error: error.message });
  }
});

// 교육과정별 테스트 통계 목록
router.get('/statistics/course/:courseId', isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.params;

    const statistics = await TestStatisticsService.getCourseTestStatistics(courseId);
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: '교육과정별 테스트 통계 조회 실패', error: error.message });
  }
});

// 문제별 정답률 분석
router.get('/statistics/:testTemplateId/questions', isAuthenticated, async (req, res) => {
  try {
    const { testTemplateId } = req.params;

    const analysis = await TestStatisticsService.getQuestionAnalysis(testTemplateId);
    if (!analysis) {
      return res.status(404).json({ message: '문제별 분석 데이터를 찾을 수 없습니다' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: '문제별 분석 실패', error: error.message });
  }
});

// 단원별/유형별 통계 분석
router.get('/statistics/:testTemplateId/categories', isAuthenticated, async (req, res) => {
  try {
    const { testTemplateId } = req.params;

    const analysis = await TestStatisticsService.getCategoryAnalysis(testTemplateId);
    if (!analysis) {
      return res.status(404).json({ message: '카테고리별 분석 데이터를 찾을 수 없습니다' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: '카테고리별 분석 실패', error: error.message });
  }
});

// 시간별 분석
router.get('/statistics/:testTemplateId/time', isAuthenticated, async (req, res) => {
  try {
    const { testTemplateId } = req.params;

    const analysis = await TestStatisticsService.getTimeAnalysis(testTemplateId);
    if (!analysis) {
      return res.status(404).json({ message: '시간별 분석 데이터를 찾을 수 없습니다' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: '시간별 분석 실패', error: error.message });
  }
});

// 교육과정별 대시보드 데이터
router.get('/statistics/dashboard/:courseId', isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.params;

    const dashboard = await TestStatisticsService.getDashboardData(courseId);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: '대시보드 데이터 조회 실패', error: error.message });
  }
});

// 테스트 결과 수정
router.put('/results/:id', isAdmin, async (req, res) => {
  try {
    const { totalScore, totalPossibleScore, answers, timeSpent, notes } = req.body;

    const result = await TestResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: '테스트 결과를 찾을 수 없습니다' });
    }

    // 테스트 템플릿 정보 가져오기 (분석 데이터 재계산용)
    const template = await TestTemplate.findById(result.testTemplateId);
    if (!template) {
      return res.status(404).json({ message: '테스트 템플릿을 찾을 수 없습니다' });
    }

    // 분석 데이터 자동 재계산
    const difficultyStats = { hard: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, easy: { correct: 0, total: 0 } };
    const chapterStats = new Map();
    const typeStats = new Map();

    answers.forEach(answer => {
      const question = template.questions.find(q => q.questionNumber === answer.questionNumber);
      if (question) {
        // 난이도별 통계
        const diffKey = question.difficulty === '상' ? 'hard' : question.difficulty === '중' ? 'medium' : 'easy';
        difficultyStats[diffKey].total++;
        if (answer.isCorrect) difficultyStats[diffKey].correct++;

        // 단원별 통계
        const chapterKey = question.chapter;
        if (!chapterStats.has(chapterKey)) {
          chapterStats.set(chapterKey, { correct: 0, total: 0 });
        }
        chapterStats.get(chapterKey).total++;
        if (answer.isCorrect) chapterStats.get(chapterKey).correct++;

        // 유형별 통계
        const typeKey = question.questionType;
        if (!typeStats.has(typeKey)) {
          typeStats.set(typeKey, { correct: 0, total: 0 });
        }
        typeStats.get(typeKey).total++;
        if (answer.isCorrect) typeStats.get(typeKey).correct++;
      }
    });

    // 결과 업데이트
    const updatedResult = await TestResult.findByIdAndUpdate(
      req.params.id,
      {
        totalScore,
        totalPossibleScore,
        answers,
        difficultyStats,
        chapterStats: Object.fromEntries(chapterStats),
        typeStats: Object.fromEntries(typeStats),
        timeSpent,
        notes
      },
      { new: true }
    ).populate('studentId', 'name').populate('testTemplateId', 'name');

    res.json(updatedResult);
  } catch (error) {
    console.error('테스트 결과 수정 실패:', error);
    res.status(500).json({ message: '테스트 결과 수정 실패', error: error.message });
  }
});

// 테스트 결과 삭제
router.delete('/results/:id', isAdmin, async (req, res) => {
  try {
    const result = await TestResult.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: '테스트 결과를 찾을 수 없습니다' });
    }
    res.json({ message: '테스트 결과가 삭제되었습니다', deletedId: req.params.id });
  } catch (error) {
    console.error('테스트 결과 삭제 실패:', error);
    res.status(500).json({ message: '테스트 결과 삭제 실패', error: error.message });
  }
});

module.exports = router;