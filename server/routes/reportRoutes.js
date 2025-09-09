const express = require('express');
const router = express.Router();
const LessonLog = require('../models/LessonLog');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const moment = require('moment-timezone');

const KST = 'Asia/Seoul';

// 공개 리포트: /r/:code
router.get('/r/:code', async (req, res) => {
  try {
    const log = await LessonLog.findById(req.params.code).lean();
    if (!log) return res.status(404).send('<h3>리포트를 찾을 수 없습니다.</h3>');

    const student = await User.findById(log.studentId).lean();

    // 출결 + 자동 학습시간 계산
    const recs = await Attendance.find({ userId: log.studentId, date: log.date }).lean();
    const checkIn  = recs.find(x => x.type === 'IN')?.time?.slice(0,5) || '';
    const checkOut = recs.find(x => x.type === 'OUT')?.time?.slice(0,5) || '';

    let studyMin = log.studyTimeMin ?? log.durationMin ?? null;
    if (studyMin == null) {
      const ins  = recs.filter(r => r.type === 'IN').map(r => r.time).sort();
      const outs = recs.filter(r => r.type === 'OUT').map(r => r.time).sort();
      if (ins.length && outs.length) {
        const mIn  = moment.tz(`${log.date} ${ins[0]}`, 'YYYY-MM-DD HH:mm:ss', KST);
        const mOut = moment.tz(`${log.date} ${outs[outs.length-1]}`, 'YYYY-MM-DD HH:mm:ss', KST);
        const diff = mOut.diff(mIn, 'minutes');
        studyMin = diff > 0 ? diff : 0;
      }
    }

    const dateLabel = moment.tz(log.date, 'YYYY-MM-DD', KST).format('YYYY-MM-DD');
    const fmt = s => String(s || '-').replace(/\n/g,'<br/>');

    const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>IG수학학원 데일리 리포트</title>
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
  .box{background:#f9fbff;border:1px solid #e5ecff;border-radius:12px;padding:14px;min-height:44px}
  .footer{padding:14px 26px;text-align:center;color:#6a7}
  @media (max-width:768px){.grid{grid-template-columns:1fr}}
</style>
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
        <h4>학습시간(분)</h4><div class="box">${(studyMin ?? '-') }</div>
        <h4>형태·강사</h4><div class="box">${fmt(log.classType)} / ${fmt(log.teacherName || log.teacher)}</div>
        <h4>태그</h4><div class="box">${(log.tags||[]).join(', ') || '-'}</div>
        <h4>다음 수업 계획</h4><div class="box">${fmt(log.planNext || log.nextPlan)}</div>
      </div>
    </div>
  </div>
  <div class="footer">이 링크는 리포트 열람용 공개 페이지입니다.</div>
</div>
</body></html>`;

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('[reportRoutes]', e);
    res.status(500).send('<h3>리포트 생성 중 오류가 발생했습니다.</h3>');
  }
});

module.exports = router;
