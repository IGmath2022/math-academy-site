// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const StudentProfile = require('../models/StudentProfile'); // 선택
const CounselLog = require('../models/CounselLog');         // 선택
const moment = require('moment-timezone');

const KST = 'Asia/Seoul';

// 공통: 코드로 리포트 데이터 적재
async function loadReportData(code, recentLimit = 10) {
  const log = await LessonLog.findById(code).lean();
  if (!log) return null;

  const student = await User.findById(log.studentId).lean();

  // 당일 출결 + 학습시간 계산
  const recs = await Attendance.find({ userId: log.studentId, date: log.date }).lean();
  const checkIn  = recs.filter(x => x.type === 'IN').sort((a,b)=>a.time.localeCompare(b.time))[0]?.time?.slice(0,5) || (log.inTime  || '');
  const checkOut = recs.filter(x => x.type === 'OUT').sort((a,b)=>b.time.localeCompare(a.time))[0]?.time?.slice(0,5) || (log.outTime || '');

  let studyMin = log.durationMin ?? log.studyTimeMin ?? null;
  if (studyMin == null && checkIn && checkOut) {
    const mIn  = moment.tz(`${log.date} ${checkIn}:00`,  'YYYY-MM-DD HH:mm:ss', KST);
    const mOut = moment.tz(`${log.date} ${checkOut}:00`, 'YYYY-MM-DD HH:mm:ss', KST);
    const diff = mOut.diff(mIn, 'minutes');
    studyMin = diff > 0 ? diff : 0;
  }

  // 누적(최근 N회) — 최신이 먼저
  const recent = await LessonLog.find({ studentId: log.studentId })
    .sort({ date: -1 })
    .limit(recentLimit)
    .lean();

  // 각 회차 메타 + 출결기반 학습시간 + 지표
  const recentWithMeta = await Promise.all(
    recent.map(async (r) => {
      // 우선 저장값
      let m = r.durationMin ?? r.studyTimeMin ?? null;

      // 없으면 출결로 계산
      if (m == null) {
        const recs2 = await Attendance.find({ userId: r.studentId, date: r.date }).lean();
        const in2  = recs2.filter(x => x.type === 'IN').sort((a,b)=>a.time.localeCompare(b.time))[0]?.time?.slice(0,5) || r.inTime || null;
        const out2 = recs2.filter(x => x.type === 'OUT').sort((a,b)=>b.time.localeCompare(a.time))[0]?.time?.slice(0,5) || r.outTime || null;
        if (in2 && out2) {
          const mi  = moment.tz(`${r.date} ${in2}:00`,  'YYYY-MM-DD HH:mm:ss', KST);
          const mo  = moment.tz(`${r.date} ${out2}:00`, 'YYYY-MM-DD HH:mm:ss', KST);
          const dff = mo.diff(mi, 'minutes');
          m = dff > 0 ? dff : 0;
        }
      }
      return {
        _id: String(r._id),
        date: r.date,
        course: r.course || '',
        headline: r.headline || '',
        tags: r.tags || [],
        studyTimeMin: m,
        focus: r.focus ?? null,            // 0~100
        progressPct: r.progressPct ?? null // %
      };
    })
  );

  // 선택: 프로필/상담
  let profileOut = null;
  try {
    const profile = await StudentProfile.findOne({ studentId: log.studentId }).lean();
    if (profile?.publicOn) {
      profileOut = {
        publicOn: true,
        school: profile.school || '',
        grade: profile.grade || '',
        targetHigh: profile.targetHigh || '',
        targetUniv: profile.targetUniv || '',
        roadmap3m: profile.roadmap3m || '',
        roadmap6m: profile.roadmap6m || '',
        roadmap12m: profile.roadmap12m || ''
      };
    }
  } catch {}

  let counselOut = [];
  try {
    const counsels = await CounselLog.find({ studentId: log.studentId, publicOn: true })
      .sort({ date: -1 }).limit(3).lean();
    counselOut = (counsels || []).map(c => ({ date: c.date, memo: c.memo }));
  } catch {}

  const dateLabel = moment.tz(log.date, 'YYYY-MM-DD', KST).format('YYYY-MM-DD');

  return {
    student,
    log: {
      ...log,
      dateLabel
    },
    checkIn,
    checkOut,
    studyMin,
    recent: recentWithMeta,
    profile: profileOut,
    counsels: counselOut
  };
}

// JSON (SPA 용): /api/reports/public/:code
router.get('/api/reports/public/:code', async (req, res) => {
  try {
    const data = await loadReportData(req.params.code, Number(req.query.limit) || 10);
    if (!data) return res.status(404).json({ message: '리포트를 찾을 수 없습니다.' });
    res.json({
      student: { _id: data.student?._id, name: data.student?.name || '' },
      log: data.log,
      attendance: { checkIn: data.checkIn, checkOut: data.checkOut }, // ⬅︎ 프론트 키와 일치
      studyTimeMin: data.studyMin,
      recent: data.recent,
      profile: data.profile,
      counsels: data.counsels
    });
  } catch (e) {
    console.error('[reportRoutes.json]', e);
    res.status(500).json({ message: '리포트 조회 오류', error: String(e?.message || e) });
  }
});

// HTML (카톡 버튼용): /r/:code
router.get('/r/:code', async (req, res) => {
  try {
    const data = await loadReportData(req.params.code, Number(req.query.limit) || 10);
    if (!data) return res.status(404).send('<h3>리포트를 찾을 수 없습니다.</h3>');

    const { log, student, checkIn, checkOut, studyMin, recent } = data;
    const dateLabel = moment.tz(log.date, 'YYYY-MM-DD', KST).format('YYYY-MM-DD');
    const fmt = (s='-') => String(s || '-').replace(/\n/g,'<br/>');

    // 차트 시리즈(최근 N회 역순 -> 시간 순으로 보이게 뒤집을 수도 있음)
    const series = recent.slice().reverse().map(r => ({
      date: r.date,
      focus: r.focus,
      progress: r.progressPct,
      duration: r.studyTimeMin
    }));

    const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>IG수학학원 데일리 리포트</title>
<link href="https://cdn.jsdelivr.net/npm/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
<style>
  body{font-family:Pretendard,system-ui,-apple-system,Segoe UI,Roboto,'Noto Sans KR',sans-serif;background:#f5f7fb;margin:0}
  .wrap{max-width:940px;margin:24px auto;padding:20px}
  .card{background:#fff;border-radius:18px;box-shadow:0 6px 20px #0001;overflow:hidden;margin-bottom:18px}
  .hd{padding:22px 26px;background:linear-gradient(180deg,#f7fbff,#eef4ff)}
  .tit{font-size:26px;font-weight:800;margin:6px 0 2px}
  .sub{color:#5a6; font-size:14px;font-weight:700}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:18px 26px}
  .col{padding:0}
  h4{margin:4px 0 10px;font-size:16px;color:#223}
  .box{background:#f9fbff;border:1px solid #e5ecff;border-radius:12px;padding:14px;min-height:44px}
  .footer{padding:14px 26px;text-align:center;color:#6a7}
  table{width:100%;border-collapse:collapse;}
  th,td{border-bottom:1px solid #eef2ff;padding:10px 8px;text-align:left;font-size:14px}
  th{background:#f7f9ff}
  .tag{display:inline-block;background:#eef2ff;border:1px solid #dde5ff;color:#345;padding:2px 8px;border-radius:999px;margin-right:6px;margin-bottom:4px;font-size:12px}
  @media (max-width:768px){.grid{grid-template-columns:1fr}}
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="hd">
      <div class="sub">IG수학학원 데일리 리포트</div>
      <div class="tit">${student?.name || '학생'} 학생</div>
      <div style="color:#5b6">${fmt(log.course)} · ${dateLabel}</div>
    </div>
    <div class="grid">
      <div class="col">
        <h4>과정</h4><div class="box">${fmt(log.course)}</div>
        <h4>교재</h4><div class="box">${fmt(log.book)}</div>
        <h4>수업내용</h4><div class="box">${fmt(log.content)}</div>
        <h4>과제</h4><div class="box">${fmt(log.homework)}</div>
        <h4>개별 피드백</h4><div class="box">${fmt(log.feedback)}</div>
      </div>
      <div class="col">
        <h4>출결</h4><div class="box">등원 ${checkIn || '-'} / 하원 ${checkOut || '-'}</div>
        <h4>학습시간(분)</h4><div class="box">${(studyMin ?? '-')}</div>
        <h4>형태·강사</h4><div class="box">${fmt(log.classType)} / ${fmt(log.teacherName || log.teacher)}</div>
        <h4>태그</h4><div class="box">${(log.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('') || '-'}</div>
        <h4>다음 수업 계획</h4><div class="box">${fmt(log.planNext || log.nextPlan)}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="hd">
      <div class="tit">최근 추세</div>
    </div>
    <div class="grid">
      <div class="col"><canvas id="chartFocus" height="240"></canvas></div>
      <div class="col"><canvas id="chartBar" height="240"></canvas></div>
    </div>
  </div>

  <div class="footer">이 링크는 리포트 열람용 공개 페이지입니다.</div>
</div>

<script>
  const series = ${JSON.stringify(series)};
  const labels   = series.map(s => (s.date || '').slice(5));
  const focus    = series.map(s => s.focus == null ? null : Number(s.focus));
  const progress = series.map(s => s.progress == null ? null : Number(s.progress));
  const duration = series.map(s => s.duration == null ? null : Number(s.duration));
  const nz = arr => arr.map(v => (v == null ? 0 : v));

  new Chart(document.getElementById('chartFocus'), {
    type: 'line',
    data: { labels, datasets: [{ label: '집중도(0~100)', data: nz(focus), tension: 0.3 }]},
    options: { responsive: true, scales: { y: { suggestedMin: 0, suggestedMax: 100, ticks: { stepSize: 20 } } } }
  });

  new Chart(document.getElementById('chartBar'), {
    type: 'bar',
    data: { labels, datasets: [
      { label: '진행률(%)', data: nz(progress) },
      { label: '학습시간(분)', data: nz(duration) }
    ]},
    options: { responsive: true }
  });
</script>
</body></html>`;

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('[reportRoutes.html]', e);
    res.status(500).send('<h3>리포트 생성 중 오류가 발생했습니다.</h3>');
  }
});

module.exports = router;
