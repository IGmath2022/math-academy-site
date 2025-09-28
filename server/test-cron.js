const mongoose = require('mongoose');
const LessonLog = require('./models/LessonLog');
const Setting = require('./models/Setting');
const { performDailyReport, previewDailyReport } = require('./services/cron/servicesAdapter');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://gounpark:Goun123456789@cluster0.ax1b7id.mongodb.net/?retryWrites=true&w=majority';

async function testCronFunctionality() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check for pending lesson logs
    const pending = await LessonLog.find({
      notifyStatus: '대기',
      scheduledAt: { $ne: null, $lte: new Date() }
    }).limit(5).lean();

    console.log('\n=== 현재 상태 ===');
    console.log('Pending lesson logs:', pending.length);
    if (pending.length > 0) {
      console.log('Sample pending log:', {
        id: pending[0]._id,
        studentId: pending[0].studentId,
        date: pending[0].date,
        notifyStatus: pending[0].notifyStatus,
        scheduledAt: pending[0].scheduledAt
      });
    }

    // Check auto report setting
    const autoSetting = await Setting.findOne({ key: 'daily_report_auto_on' });
    console.log('Auto report setting:', autoSetting?.value || 'not set');

    // Check template setting
    const tplSetting = await Setting.findOne({ key: 'daily_tpl_code' });
    console.log('Template code setting:', tplSetting?.value || 'not set');
    console.log('Template code from env:', process.env.DAILY_REPORT_TPL_CODE || 'not set');

    // Test preview function
    console.log('\n=== Preview Test ===');
    const previewResult = await previewDailyReport({ limit: 10 });
    console.log('Preview result:', previewResult);

    // Test perform function (dry run)
    console.log('\n=== Perform Test ===');
    const performResult = await performDailyReport({ limit: 3 });
    console.log('Perform result:', performResult);

    await mongoose.disconnect();
    console.log('\nTest completed');
  } catch (error) {
    console.error('Test error:', error);
    await mongoose.disconnect();
  }
}

testCronFunctionality();