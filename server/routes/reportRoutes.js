// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const StudentProfile = require('../models/StudentProfile');
const CounselLog = require('../models/CounselLog');
const moment = require('moment-timezone');

const KST = 'Asia/Seoul';

// 공개 리포트 뷰(/r/:code)
router.get('/r/:code', async (req, res) => {
  try {
    const log = await LessonLog.findById(req.params.code).lean();
    if (!log) return res.status(404).send('<h3>리포트를 찾을 수 없습니다.</h3>');

    const student = await User.findById(log.studentId).lean();

    // 출결
    const inOut = await Attendance.find({ userId: log.studentId, date: log.date }).lean();
    const checkIn  = inOut.find(x => x.type === 'IN')?.time?.slice(0,5) || '';
    const checkOut = inOut.find(x => x.type === 'OUT')?.time?.slice(0,5) || '';

    // 최근 5회
    const recent = await LessonLog.find({ studentId: log.studentId })
      .sort({ date: -1 }).limit(5).lean();
    const series = recent.slice().reverse().map(r => ({
      date: r.date, focus: r.focus ?? null, durationMin: r.durationMin ?? null, progressPct: r.progressPct ?? null,
      headline: r.headline || ''
    }));

    // 학생 프로필 + 상담 최근 3건(공개만)
    const profile = await StudentProfile.findOne({ studentId: log.studentId }).lean();
    const counsels = await CounselLog.find({ studentId: log.studentId, publicOn: true })
      .sort({ date: -1 }).limit(3).lean();

    const fmt = (s='') => String(s || '').replace(/\n/g,'<br/>');

    const dateLabel = moment.tz(log.date, 'YYYY-MM-DD', KST).format('YYYY-MM-DD');

    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>IG수학학원 데일리 리포트</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://cdn.jsdelivr.net/npm/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
<style>
  body{font-family:Pretendard,system-ui,-apple-system,Segoe UI,Roboto,'Noto Sans KR',sans-serif;background:#f5f7fb;margin:0}
  .wrap{max-width:920px;margin:24px auto;padding:20px}
  .card{background:#fff;border-radius:18px;box-shadow:0 6px 20px #0001;overflow:hidden;margin-bottom:18px}
  .hd{padding:22px 26px;background:linear-gradient(180deg,#f7fbff,#eef4ff)}
  .tit{font-size:26px;font-weight:800;margin:6px 0 2px}
  .sub{color:#5a6; font-size:14px;font-weight:700}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:18px 26px}
  .col{padding:0}
  h4{margin:4px 0 10px;font-size:16px;color:#223}
  .box{background:#f9fbff;border:1px solid #e5ecff;border-radius:12px;padding:14px}
  .muted{color:#6a7}
  .tag{display:inline-block;background:#eef2ff;border:1px solid #dde5ff;color:#345;padding:2px 8px;border-radius:999px;margin-right:6px;margin-bottom:6px;font-size:12px}
  .footer{padding:14px 26px;text-align:center;color:#6a7}
  .list{list-style:none;margin:0;padding:0}
  .list li{padding:8px 0;border-bottom:1px solid #f0f2f8}
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
      <div class="muted">${log.course || '-'} · ${dateLabel}</div>
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
        <h4>출결</h4>
        <div class="box">등원 ${checkIn || '-'} / 하원 ${checkOut || '-'}</div>
        <h4>형태·강사</h4>
        <div class="box">${(log.classType||'-')} / ${(log.teacher||'-')}</div>
        <h4>핵심 한줄</h4>
        <div class="box">${fmt(log.headline||'-')}</div>
        <h4>태그</h4>
        <div class="box">${(log.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('') || '-'}</div>
        <h4>학습지표</h4>
        <div class="box">집중도: ${log.focus ?? '-'} · 학습시간: ${log.durationMin ?? '-'}분 · 진행률: ${log.progressPct ?? '-'}%</div>
      </div>
    </div>
  </div>

  ${profile?.publicOn ? `
  <div class="card">
    <div class="hd"><div class="tit">프로필 & 로드맵</div></div>
    <div class="grid">
      <div class="col">
        <h4>학교/학년</h4><div class="box">${fmt(profile.school)} ${fmt(profile.grade)}</div>
        <h4>희망 진학</h4><div class="box">${fmt(profile.targetHigh || profile.targetUniv || '-')}</div>
      </div>
      <div class="col">
        <h4>목표(3/6/12개월)</h4>
        <div class="box">
          <div><b>3개월</b> — ${fmt(profile.roadmap3m||'-')}</div>
          <div style="margin-top:6px"><b>6개월</b> — ${fmt(profile.roadmap6m||'-')}</div>
          <div style="margin-top:6px"><b>12개월</b> — ${fmt(profile.roadmap12m||'-')}</div>
        </div>
      </div>
    </div>
  </div>` : ''}

  ${counsels?.length ? `
  <div class="card">
    <div class="hd"><div class="tit">최근 상담 메모</div></div>
    <div class="grid"><div class="col" style="grid-column:1/-1">
      <ul class="list">
        ${counsels.map(c=>`<li><b>${c.date}</b> — ${fmt(c.memo)}</li>`).join('')}
      </ul>
    </div></div>
  </div>` : ''}

  <div class="card">
    <div class="hd"><div class="tit">최근 5회 추세</div></div>
    <div class="grid">
      <div class="col"><canvas id="line1" height="220"></canvas></div>
      <div class="col"><canvas id="bar1" height="220"></canvas></div>
    </div>
  </div>

  <div class="footer">이 링크는 리포트 열람용 공개 페이지입니다.</div>
</div>

<script>
  const series = ${JSON.stringify(series)};
  const labels = series.map(s=>s.date.slice(5));
  const focus = series.map(s=>s.focus);
  const duration = series.map(s=>s.durationMin);
  const progress = series.map(s=>s.progressPct);

  new Chart(document.getElementById('line1'), {
    type:'line',
    data:{ labels, datasets:[{ label:'집중도', data:focus, tension:.3 }]},
    options:{ responsive:true, scales:{ y:{ suggestedMin:0, suggestedMax:100 } } }
  });
  new Chart(document.getElementById('bar1'), {
    type:'bar',
    data:{ labels,
      datasets:[
        { label:'진행률(%)', data:progress },
        { label:'학습시간(분)', data:duration }
      ]
    },
    options:{ responsive:true }
  });
</script>
</body></html>`;

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('[reportRoutes]', e);
    res.status(500).send('<h3>리포트 생성 중 오류가 발생했습니다.</h3>');
  }
});

module.exports = router;
