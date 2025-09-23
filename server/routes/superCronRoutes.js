// server/routes/superCronRoutes.js  ← [ADD]
const express = require('express');
const router = express.Router();
const { seedFromEnvIfEmpty, getSettings, updateSettings } = require('../services/cron/settingsService');
const { runAutoLeave } = require('../services/cron/jobs/autoLeaveJob');
const { runDailyReport } = require('../services/cron/jobs/dailyReportJob');
const Setting = require('../models/Setting');
// TODO: 관리자 인증 미들웨어 연결
// const { requireAdmin } = require('../middleware/auth');

const buildServicesAdapter = () => ({
  // 자동하원 미리보기 - 등원했지만 하원하지 않은 학생들 조회
  previewAutoLeave: async ({ limit = 500 }) => {
    const moment = require('moment-timezone');
    const Attendance = require('../models/Attendance');
    const User = require('../models/User');

    const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');

    // 오늘 등원한 학생들 조회
    const checkIns = await Attendance.find({
      date: today,
      type: 'IN'
    }).populate('userId', 'name parentPhone').lean();

    const list = [];
    for (const checkIn of checkIns.slice(0, limit)) {
      // 해당 학생이 하원했는지 확인
      const checkOut = await Attendance.findOne({
        userId: checkIn.userId._id,
        date: today,
        type: 'OUT'
      }).lean();

      if (!checkOut) {
        // 하원 기록이 없는 학생
        list.push({
          studentId: checkIn.userId._id,
          studentName: checkIn.userId.name,
          parentPhone: checkIn.userId.parentPhone,
          checkInTime: checkIn.time,
          date: today
        });
      }
    }

    return { list, count: list.length };
  },

  // 자동하원 실행 - 실제로 하원 처리
  performAutoLeave: async ({ limit = 500 }) => {
    const moment = require('moment-timezone');
    const Attendance = require('../models/Attendance');
    const User = require('../models/User');
    const { sendAlimtalk } = require('../utils/alimtalk');

    const now = moment().tz('Asia/Seoul');
    const today = now.format('YYYY-MM-DD');
    const currentTime = now.format('HH:mm:ss');

    // 먼저 미리보기로 대상자 확인
    const { list } = await buildServicesAdapter().previewAutoLeave({ limit });

    const processed = [];
    for (const student of list) {
      try {
        // 자동 하원 처리
        await Attendance.create({
          userId: student.studentId,
          date: today,
          type: 'OUT',
          time: currentTime,
          auto: true,
          notified: false
        });

        // 알림톡 발송
        await sendAlimtalk(student.parentPhone, 'UB_0082', {
          name: student.studentName,
          type: '하원',
          time: now.format('HH:mm'),
          automsg: '(자동 하원 처리)'
        });

        processed.push({
          studentName: student.studentName,
          checkInTime: student.checkInTime,
          autoCheckOutTime: currentTime
        });
      } catch (error) {
        console.error(`자동 하원 처리 실패 - ${student.studentName}:`, error);
      }
    }

    return { processed: processed.length, preview: processed };
  },

  // 일일 리포트 미리보기 - 발송 대상 리포트들 조회
  previewDailyReport: async ({ limit = 500 }) => {
    const moment = require('moment-timezone');
    const LessonLog = require('../models/LessonLog');

    // 전날 작성된 리포트를 다음날 아침에 발송
    const yesterday = moment().tz('Asia/Seoul').subtract(1, 'day').format('YYYY-MM-DD');

    // 어제 작성된 리포트 중 발송 대기 상태인 것들 조회
    const reports = await LessonLog.find({
      date: yesterday,
      notifyStatus: '대기'
    })
    .populate('studentId', 'name parentPhone')
    .limit(limit)
    .lean();

    const list = reports.map(report => ({
      logId: report._id,
      studentId: report.studentId._id,
      studentName: report.studentId.name,
      parentPhone: report.studentId.parentPhone,
      course: report.course,
      content: report.content,
      homework: report.homework,
      date: report.date,
      scheduledAt: report.scheduledAt
    }));

    return { list, count: list.length };
  },

  // 일일 리포트 실행 - 실제로 리포트 발송
  performDailyReport: async ({ limit = 500 }) => {
    const moment = require('moment-timezone');
    const LessonLog = require('../models/LessonLog');
    const { sendReportAlimtalk } = require('../utils/alimtalkReport');
    const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';

    // 먼저 미리보기로 대상 확인
    const { list } = await buildServicesAdapter().previewDailyReport({ limit });

    const processed = [];
    for (const report of list) {
      try {
        // 리포트 URL 생성
        const reportUrl = `${REPORT_BASE}/r/${report.logId}`;

        // 알림톡 발송
        await sendReportAlimtalk(report.parentPhone, {
          studentName: report.studentName,
          course: report.course,
          content: report.content,
          homework: report.homework,
          reportUrl: reportUrl,
          date: report.date
        });

        // 발송 상태 업데이트
        await LessonLog.findByIdAndUpdate(report.logId, {
          notifyStatus: '발송',
          notifyLog: `자동발송 완료 - ${moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')}`
        });

        processed.push({
          studentName: report.studentName,
          course: report.course,
          reportUrl: reportUrl
        });
      } catch (error) {
        console.error(`리포트 발송 실패 - ${report.studentName}:`, error);

        // 발송 실패 기록
        await LessonLog.findByIdAndUpdate(report.logId, {
          notifyStatus: '실패',
          notifyLog: `자동발송 실패 - ${error.message}`
        });
      }
    }

    return { processed: processed.length, preview: processed };
  }
});

router.get('/cron-settings', /*requireAdmin,*/ async (req, res) => {
  await seedFromEnvIfEmpty(Setting, process.env);
  const s = await getSettings(Setting);
  res.json(s);
});

router.put('/cron-settings', /*requireAdmin,*/ async (req, res) => {
  try {
    const next = await updateSettings(Setting, req.body, { updatedBy: req.user?._id || 'admin' });
    res.json(next);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Invalid settings' });
  }
});

// Run now: type = autoLeave | dailyReport
router.post('/cron/run-now', /*requireAdmin,*/ async (req, res) => {
  const { type, overrideNow, force } = req.body || {};
  const Services = buildServicesAdapter();
  try {
    let out;
    if (type === 'autoLeave') out = await runAutoLeave({ Setting, Services, overrideNow, force });
    else if (type === 'dailyReport') out = await runDailyReport({ Setting, Services, overrideNow, force });
    else return res.status(400).json({ message: 'type must be autoLeave or dailyReport' });
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: e.message || 'run failed' });
  }
});

module.exports = router;
