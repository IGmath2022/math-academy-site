// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');

const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// 선택 기능(있으면 사용, 없으면 스킵)
let StudentProfile = null;
let CounselLog = null;
try { StudentProfile = require('../models/StudentProfile'); } catch {}
try { CounselLog = require('../models/CounselLog'); } catch {}

const KST = 'Asia/Seoul';

/**
 * 공개 리포트 JSON
 * GET /api/reports/public/:id  (id = LessonLog _id)
 * 응답:
 * {
 *   ok: true,
 *   report: { ...메인 리포트 필드... },
 *   series: [최근5회 요약],
 *   profile: { ...학생 프로필... } | null,
 *   counsels: [{date, memo}] // publicOn=true만
 * }
 */
router.get('/api/reports/public/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const log = await LessonLog.findById(id).lean();
    if (!log) return res.status(404).json({ ok: false, message: '리포트를 찾을 수 없습니다.' });

    const student = await User.findById(log.studentId).lean();

    // 출결(해당일)
    const inOut = await Attendance.find({ userId: log.studentId, date: log.date }).lean();
    const checkIn  = inOut.find(x => x.type === 'IN')?.time?.slice(0,5) || '';
    const checkOut = inOut.find(x => x.type === 'OUT')?.time?.slice(0,5) || '';

    // 최근 5회(역순 정렬 후 최신 5개 → 표시용은 과거→최신 순으로 뒤집어 전달)
    const recent = await LessonLog.find({ studentId: log.studentId })
      .sort({ date: -1 }).limit(5).lean();

    const series = recent.slice().reverse().map(r => ({
      id: String(r._id),
      date: r.date,
      // 확장 지표(없으면 null)
      focus: r.focus ?? null,
      progressPct: r.progressPct ?? null,
      studyTimeMin: r.studyTimeMin ?? r.durationMin ?? null, // 에디터는 studyTimeMin 사용
      headline: r.headline || '',
      tags: Array.isArray(r.tags) ? r.tags : []
    }));

    // 학생 프로필/상담 (모델이 존재할 때만)
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

    const dateLabel = moment.tz(log.date, 'YYYY-MM-DD', KST).format('YYYY-MM-DD');

    const report = {
      id: String(log._id),
      date: log.date,
      dateLabel,
      student: { id: String(student?._id || ''), name: student?.name || '' },

      // 메인 본문 필드
      course: log.course || '',
      book: log.book || '',
      content: log.content || '',
      homework: log.homework || '',
      feedback: log.feedback || '',

      // 선택 확장 필드(없으면 공백/기본)
      classType: log.classType || '',
      teacherName: log.teacherName || log.teacher || '',
      studyTimeMin: typeof log.studyTimeMin === 'number' ? log.studyTimeMin : (log.durationMin ?? null),
      planNext: log.planNext || '',
      tags: Array.isArray(log.tags) ? log.tags : [],

      // 출결
      checkIn,
      checkOut
    };

    res.json({ ok: true, report, series, profile, counsels });
  } catch (e) {
    console.error('[reportRoutes /api/reports/public/:id] ERR:', e);
    res.status(500).json({ ok: false, message: '리포트 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * (선택) 서버 도메인으로 잘못 들어온 /r/:code 를 프론트로 리다이렉트
 * 버튼 링크는 이미 프론트 도메인(https://ig-math-2022.onrender.com/r/:code)라서
 * 보통 필요 없지만, 혹시 대비용으로 둡니다.
 */
router.get('/r/:code', (req, res) => {
  const FRONT_BASE = (process.env.FRONT_BASE_URL || 'https://ig-math-2022.onrender.com').replace(/\/+$/, '');
  res.redirect(302, `${FRONT_BASE}/r/${encodeURIComponent(req.params.code)}`);
});

module.exports = router;
