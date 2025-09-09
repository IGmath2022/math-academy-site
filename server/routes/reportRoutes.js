// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');

const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

let StudentProfile = null;
let CounselLog = null;
try { StudentProfile = require('../models/StudentProfile'); } catch {}
try { CounselLog = require('../models/CounselLog'); } catch {}

const KST = 'Asia/Seoul';

function firstNonEmpty(arr, def = '') {
  for (const v of arr) {
    if (v === 0) return 0;
    if (v === false) continue;
    if (v === null || v === undefined) continue;
    const s = String(v);
    if (s.trim().length) return v;
  }
  return def;
}

/** 공개 JSON */
router.get('/api/reports/public/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const log = await LessonLog.findById(id).lean();
    if (!log) return res.status(404).json({ ok: false, message: '리포트를 찾을 수 없습니다.' });

    // 학생
    const student = await User.findById(log.studentId).lean().catch(() => null);

    // 출결
    const inOut = await Attendance.find({ userId: log.studentId, date: log.date }).lean();
    const checkIn  = inOut.find(x => x.type === 'IN')?.time?.slice(0,5) || '';
    const checkOut = inOut.find(x => x.type === 'OUT')?.time?.slice(0,5) || '';

    // 최근 5회
    const recent = await LessonLog.find({ studentId: log.studentId })
      .sort({ date: -1 }).limit(5).lean();

    const series = recent.slice().reverse().map(r => ({
      id: String(r._id),
      date: r.date,
      focus: r.focus ?? null,
      progressPct: r.progressPct ?? null,
      studyTimeMin: (typeof r.studyTimeMin === 'number' ? r.studyTimeMin :
                    (typeof r.durationMin === 'number' ? r.durationMin : null)),
      headline: r.headline || '',
      tags: Array.isArray(r.tags) ? r.tags : []
    }));

    // 값 폴백(이전/다른 이름까지 커버)
    const course   = firstNonEmpty([log.course, log.courseName, log.curriculum]);
    const book     = firstNonEmpty([log.book, log.textbook, log.books]);
    const content  = firstNonEmpty([log.content, log.summary, log.lessonContent, log.classContent]);
    const homework = firstNonEmpty([log.homework, log.hw, log.assignment]);
    const feedback = firstNonEmpty([log.feedback, log.comment, log.personalFeedback]);

    const classType    = firstNonEmpty([log.classType, log.class_type]);
    const teacherName  = firstNonEmpty([log.teacherName, log.teacher, log.tutor]);
    const studyTimeMin = (typeof log.studyTimeMin === 'number'
                          ? log.studyTimeMin
                          : (typeof log.durationMin === 'number' ? log.durationMin : null));
    const planNext     = firstNonEmpty([log.planNext, log.nextPlan, log.nextLessonPlan]);
    const tags         = Array.isArray(log.tags) ? log.tags
                         : (typeof log.tags === 'string' ? log.tags.split(',').map(s=>s.trim()).filter(Boolean) : []);

    const dateLabel = moment.tz(log.date, 'YYYY-MM-DD', KST).format('YYYY-MM-DD');

    const report = {
      id: String(log._id),
      date: log.date,
      dateLabel,

      // 학생 정보(중복 제공: nested + flat)
      student: { id: String(student?._id || ''), name: student?.name || firstNonEmpty([log.studentName]) || '' },
      studentName: student?.name || firstNonEmpty([log.studentName]) || '',

      // 본문
      course: course || '',
      book: book || '',
      content: content || '',
      homework: homework || '',
      feedback: feedback || '',

      // 확장
      classType,
      teacherName,
      studyTimeMin,
      planNext,
      tags,

      // 출결
      checkIn,
      checkOut
    };

    // 프로필/상담(있으면)
    let profile = null;
    if (StudentProfile) {
      const p = await StudentProfile.findOne({ studentId: log.studentId }).lean();
      if (p) {
        profile = {
          publicOn: !!p.publicOn,
          school: p.school || '',
          grade: p.grade || '',
          targetHigh: p.targetHigh || '',
          targetUniv: p.targetUniv || '',
          roadmap3m: p.roadmap3m || '',
          roadmap6m: p.roadmap6m || '',
          roadmap12m: p.roadmap12m || ''
        };
      }
    }

    let counsels = [];
    if (CounselLog) {
      const cs = await CounselLog.find({ studentId: log.studentId, publicOn: true })
        .sort({ date: -1 }).limit(3).lean();
      counsels = cs.map(c => ({ date: c.date, memo: c.memo || '' }));
    }

    return res.json({ ok: true, report, series, profile, counsels });
  } catch (e) {
    console.error('[reportRoutes /api/reports/public/:id] ERR:', e);
    return res.status(500).json({ ok: false, message: '리포트 조회 중 오류가 발생했습니다.' });
  }
});

/** 안전 리다이렉트(서버 도메인으로 /r/:code 들어온 경우 프론트로 보내기) */
router.get('/r/:code', (req, res) => {
  const FRONT_BASE = (process.env.FRONT_BASE_URL || 'https://ig-math-2022.onrender.com').replace(/\/+$/, '');
  res.redirect(302, `${FRONT_BASE}/r/${encodeURIComponent(req.params.code)}`);
});

module.exports = router;
