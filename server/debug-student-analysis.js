const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Curriculum = require('./models/Curriculum');
const TestTemplate = require('./models/TestTemplate');
const TestResult = require('./models/TestResult');
const StudentAnalysis = require('./models/StudentAnalysis');

const [,, studentId, courseId] = process.argv;

async function run() {
  try {
    if (!studentId || !courseId) {
      console.error('사용법: node debug-student-analysis.js <studentId> <courseId>');
      process.exit(1);
    }
    const uri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

    const curriculum = await Curriculum.findOne({ courseId }).lean();
    console.log('--------------------------------------------------');
    if (!curriculum) {
      console.log(`curriculum(${courseId}) not found`);
    } else {
      console.log(`Curriculum: ${curriculum.courseName} (${courseId}), chapters=${curriculum.chapters.length}`);
      curriculum.chapters.forEach((chapter) => {
        console.log(`  - chapter ${chapter.chapterId}: ${chapter.chapterName}, types=${chapter.types.length}`);
      });
    }

    const templates = await TestTemplate.find({ courseId }).lean();
    console.log('--------------------------------------------------');
    console.log(`Templates (${templates.length})`);
    for (const tpl of templates) {
      const missingMeta = tpl.questions
        .filter(q => !q.chapter || !q.questionType)
        .map(q => q.questionNumber);
      console.log(`  * ${tpl.name} (${tpl._id}) - questions=${tpl.questions.length}${missingMeta.length ? `, missing meta: ${missingMeta.join(',')}` : ''}`);
    }

    const results = await TestResult.find({ studentId, testTemplateId: { $in: templates.map(t => t._id) } }).lean();
    console.log('--------------------------------------------------');
    console.log(`TestResults (${results.length}) for student ${studentId}`);
    for (const result of results) {
      const tpl = templates.find(t => String(t._id) === String(result.testTemplateId));
      console.log(`  * template=${tpl?.name || result.testTemplateId} answers=${result.answers.length}`);
      if (tpl) {
        const mismatch = result.answers.filter(a => !tpl.questions.find(q => String(q.questionNumber) === String(a.questionNumber)));
        if (mismatch.length) {
          console.log(`    - question numbers not in template: ${mismatch.map(m => m.questionNumber).join(',')}`);
        }
      }
    }

    const analysis = await StudentAnalysis.findOne({ studentId, courseId }).lean();
    console.log('--------------------------------------------------');
    if (!analysis) {
      console.log('StudentAnalysis 없음');
    } else {
      console.log(`StudentAnalysis: totalTests=${analysis.totalTests}, totalQuestions=${analysis.totalQuestions}, totalCorrect=${analysis.totalCorrect}`);
      const chapterLines = (analysis.chapterAnalysis || []).map(c => `${c.chapterName}: ${c.correctAnswers}/${c.totalQuestions}`);
      const typeLines = (analysis.typeAnalysis || []).map(t => `${t.typeName}(${t.chapterName}): ${t.correctAnswers}/${t.totalQuestions}`);
      console.log('  ChapterAnalysis');
      chapterLines.forEach(line => console.log('    - ' + line));
      console.log('  TypeAnalysis');
      typeLines.forEach(line => console.log('    - ' + line));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
