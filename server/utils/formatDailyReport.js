// server/utils/formatDailyReport.js

function _clip(text = '', max) {
  const s = String(text || '').trim();
  if (!max || s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
function _lines(text = '') {
  return (text || '').split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}
function _joinHomework(text = '', maxLines = 4) {
  const arr = _lines(text);
  if (arr.length <= maxLines) return arr.join(', ');
  return [...arr.slice(0, maxLines), `외 ${arr.length - maxLines}건`].join(', ');
}

/** 템플릿 본문과 100% 동일 구조로 조립 */
function buildDailyTemplateBody({ course, book, content, homework, feedback }) {
  // 수업요약: 2문장/120자 내 권장
  const c = _clip(content.replace(/\s+\n/g, ' ').trim(), 120);
  // 과제요약: 최대 4개 항목을 한 줄로
  const h = _clip(_joinHomework(homework, 4), 180);
  // 피드백요약: 300~350자 권장
  const f = _clip(feedback.replace(/\n{2,}/g, '\n').trim(), 350);

  return [
    `1. 과정 : ${course || '-'}`,
    `2. 교재 : ${book || '-'}`,
    `3. 수업내용 : ${c || '-'}`,
    `4. 과제 : ${h || '-'}`,
    `5. 개별 피드백 : ${f || '-'}`
  ].join('\n');
}

/** 타이틀 2줄(각 23자 가드) */
function makeTwoLineTitle(studentName, course, dateLabel, max = 23) {
  const ell = s => (s.length <= max ? s : s.slice(0, max - 1) + '…');
  const line1 = ell(`${studentName} 학생`);

  // 2줄차 축약 규칙
  let line2 = `${course} ${dateLabel}`.trim();

  if (line2.length > max) {
    const noDow = dateLabel.replace(/\(.+?\)/, '').trim(); // 요일 제거
    line2 = `${course} ${noDow}`.trim();
  }
  if (line2.length > max) {
    const repl = [
      ['개별맞춤수업','개별'], ['판서강의','판서'], ['방학특강','특강'],
      ['중등수학','중수'], ['고등수학','고수'], ['심화반','심화'], ['기본반','기본']
    ];
    let c = course || '';
    for (const [a,b] of repl) c = c.replace(a,b);
    line2 = `${c} ${dateLabel.replace(/\(.+?\)/, '').trim()}`.trim();
  }
  if (line2.length > max) {
    // 날짜 더 축약: MM.DD
    const mmdd = (dateLabel.match(/\d{4}\.(\d{2}\.\d{2})/) || [,''])[1] || dateLabel;
    line2 = `${course} ${mmdd}`.trim();
  }
  if (line2.length > max) line2 = ell(line2);

  return `${line1}\n${line2}`;
}

module.exports = { buildDailyTemplateBody, makeTwoLineTitle };
