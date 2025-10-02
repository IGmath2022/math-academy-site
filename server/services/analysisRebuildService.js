const StudentAnalysis = require('../models/StudentAnalysis');
const TestResult = require('../models/TestResult');
const AnalysisService = require('./analysisService');

async function recalculateStudentAnalysis(studentId) {
  const results = await TestResult.find({ studentId }).sort({ testDate: 1, createdAt: 1 });
  await StudentAnalysis.deleteMany({ studentId });

  for (const result of results) {
    await AnalysisService.updateStudentAnalysis({
      studentId: result.studentId,
      testTemplateId: result.testTemplateId,
      totalScore: result.totalScore,
      totalPossibleScore: result.totalPossibleScore,
      answers: result.answers
    });
  }

  return AnalysisService.getStudentAnalysisSummary(studentId);
}

module.exports = {
  recalculateStudentAnalysis,
};
