const StudentAnalysis = require('../models/StudentAnalysis');
const TestResult = require('../models/TestResult');
const TestTemplate = require('../models/TestTemplate');
const Curriculum = require('../models/Curriculum');

function getChapterId(curriculum, chapterName) {
  if (!curriculum?.chapters) return chapterName;
  const chapter = curriculum.chapters.find((c) => c.chapterName === chapterName || c.chapterId === chapterName);
  return chapter?.chapterId || chapterName;
}

function getChapterName(curriculum, chapterId, fallback) {
  if (!curriculum?.chapters) return fallback || chapterId;
  const chapter = curriculum.chapters.find((c) => c.chapterId === chapterId || c.chapterName === chapterId);
  return chapter?.chapterName || fallback || chapterId;
}

function getTypeId(curriculum, chapterId, typeName) {
  if (!curriculum?.chapters) return typeName;
  const chapter = curriculum.chapters.find((c) => c.chapterId === chapterId || c.chapterName === chapterId);
  if (!chapter?.types) return typeName;
  const type = chapter.types.find((t) => t.typeName === typeName || t.typeId === typeName);
  return type?.typeId || typeName;
}

function buildAnalysisDocument(studentId, aggregate) {
  const chapterAnalysis = Array.from(aggregate.chapterMap.values()).map((entry) => {
    const accuracy = entry.totalQuestions > 0 ? Math.round((entry.correctAnswers / entry.totalQuestions) * 100) : 0;
    return {
      ...entry,
      accuracy,
      level: StudentAnalysis.calculateLevel(accuracy),
      lastUpdated: new Date(),
    };
  });

  const typeAnalysis = Array.from(aggregate.typeMap.values()).map((entry) => {
    const accuracy = entry.totalQuestions > 0 ? Math.round((entry.correctAnswers / entry.totalQuestions) * 100) : 0;
    return {
      ...entry,
      accuracy,
      level: StudentAnalysis.calculateLevel(accuracy),
      lastUpdated: new Date(),
    };
  });

  const difficultyAnalysis = Array.from(aggregate.difficultyMap.values()).map((entry) => {
    const accuracy = entry.totalQuestions > 0 ? Math.round((entry.correctAnswers / entry.totalQuestions) * 100) : 0;
    return {
      ...entry,
      accuracy,
      level: StudentAnalysis.calculateLevel(accuracy),
      lastUpdated: new Date(),
    };
  });

  const recentScores = aggregate.recentScores
    .sort((a, b) => new Date(b.testDate) - new Date(a.testDate))
    .slice(0, 10);

  const overallAccuracy = aggregate.totalQuestions > 0
    ? Math.round((aggregate.totalCorrect / aggregate.totalQuestions) * 100)
    : 0;

  return {
    studentId,
    courseId: aggregate.courseId,
    courseName: aggregate.courseName,
    totalTests: aggregate.totalTests,
    totalQuestions: aggregate.totalQuestions,
    totalCorrect: aggregate.totalCorrect,
    overallAccuracy,
    chapterAnalysis,
    typeAnalysis,
    difficultyAnalysis,
    recentScores,
    lastUpdated: new Date(),
  };
}

async function recalculateStudentAnalysis(studentId) {
  const results = await TestResult.find({ studentId }).sort({ testDate: 1 }).lean();

  if (!results.length) {
    await StudentAnalysis.deleteMany({ studentId });
    return [];
  }

  const templateCache = new Map();
  const curriculumCache = new Map();
  const courseAggregates = new Map();

  for (const result of results) {
    const templateId = result.testTemplateId?.toString?.() || String(result.testTemplateId);

    if (!templateCache.has(templateId)) {
      const template = await TestTemplate.findById(templateId).lean();
      templateCache.set(templateId, template || null);
    }

    const template = templateCache.get(templateId);
    if (!template) continue;

    const courseId = template.courseId;
    if (!courseAggregates.has(courseId)) {
      if (!curriculumCache.has(courseId)) {
        const curriculum = await Curriculum.findOne({ courseId }).lean();
        curriculumCache.set(courseId, curriculum || null);
      }

      const curriculum = curriculumCache.get(courseId);
      courseAggregates.set(courseId, {
        courseId,
        courseName: curriculum?.courseName || template.courseId,
        totalTests: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        chapterMap: new Map(),
        typeMap: new Map(),
        difficultyMap: new Map(),
        recentScores: [],
      });
    }

    const aggregate = courseAggregates.get(courseId);
    const curriculum = curriculumCache.get(courseId);

    const answers = Array.isArray(result.answers) ? result.answers : [];
    aggregate.totalTests += 1;
    aggregate.totalQuestions += answers.length;
    aggregate.totalCorrect += answers.filter((answer) => answer.isCorrect).length;

    for (const answer of answers) {
      const question = (template.questions || []).find((q) => q.questionNumber === answer.questionNumber);
      if (!question) continue;

      const chapterId = getChapterId(curriculum, question.chapter);
      const chapterName = getChapterName(curriculum, chapterId, question.chapter);
      const chapterKey = chapterId || chapterName || '기타';

      let chapterEntry = aggregate.chapterMap.get(chapterKey);
      if (!chapterEntry) {
        chapterEntry = {
          chapterId: chapterId || chapterKey,
          chapterName,
          totalQuestions: 0,
          correctAnswers: 0,
        };
        aggregate.chapterMap.set(chapterKey, chapterEntry);
      }
      chapterEntry.totalQuestions += 1;
      if (answer.isCorrect) chapterEntry.correctAnswers += 1;

      if (question.questionType) {
        const typeId = getTypeId(curriculum, chapterId, question.questionType);
        const typeKey = `${chapterKey}::${typeId}`;
        let typeEntry = aggregate.typeMap.get(typeKey);
        if (!typeEntry) {
          typeEntry = {
            chapterId: chapterId || chapterKey,
            chapterName,
            typeId,
            typeName: question.questionType,
            totalQuestions: 0,
            correctAnswers: 0,
          };
          aggregate.typeMap.set(typeKey, typeEntry);
        }
        typeEntry.totalQuestions += 1;
        if (answer.isCorrect) typeEntry.correctAnswers += 1;
      }

      if (question.difficulty) {
        const difficulty = question.difficulty;
        let diffEntry = aggregate.difficultyMap.get(difficulty);
        if (!diffEntry) {
          diffEntry = {
            difficulty,
            totalQuestions: 0,
            correctAnswers: 0,
          };
          aggregate.difficultyMap.set(difficulty, diffEntry);
        }
        diffEntry.totalQuestions += 1;
        if (answer.isCorrect) diffEntry.correctAnswers += 1;
      }
    }

    const accuracy = answers.length
      ? Math.round((answers.filter((answer) => answer.isCorrect).length / answers.length) * 100)
      : 0;

    aggregate.recentScores.push({
      testId: result.testTemplateId,
      testName: template.name,
      score: result.totalScore,
      totalScore: result.totalPossibleScore,
      accuracy,
      testDate: result.testDate || new Date(),
    });
  }

  await StudentAnalysis.deleteMany({ studentId });

  const documents = Array.from(courseAggregates.values()).map((aggregate) =>
    buildAnalysisDocument(studentId, aggregate)
  );

  if (documents.length) {
    await StudentAnalysis.insertMany(documents);
  }

  return documents;
}

module.exports = {
  recalculateStudentAnalysis,
};



