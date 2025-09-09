// server/utils/formatDailyReport.js
// 템플릿 본문과 100% 일치하도록 message_1 문자열을 생성한다.

function _clip(text = '', max) {
  const s = String(text || '').trim();
  if (!max || s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function _lines(text = '') {
  return (text || '')
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);
}

function _joinHomework(text = '', maxLines = 4) {
  const arr = _lines(text);
  if (arr.length <= maxLines) return arr.join(', ');
  return [...arr.slice(0, maxLines), `외 ${arr.length - maxLines}건`].join(', ');
}

// ====== 템플릿 본문과 “완전히 동일”한 message_1 생성 (CRLF 사용) ======
function buildDailyTemplateMessage({ studentName, course, dateLabel, book, content, homework, feedback }) {
  // 템플릿: “IG수학학원 데일리 리포트” 헤더 + 빈 줄
  const header = 'IG수학학원 데일리 리포트';

  const titleLine1 = `${studentName || ''} 학생`;
  const titleLine2 = `${course || ''} ${dateLabel || ''}`.trim();

  const c = _clip(String(content || '').replace(/\s+\n/g, ' ').trim(), 120);
  const h = _clip(_joinHomework(homework || '', 4), 180);
  const f = _clip(String(feedback || '').replace(/\n{2,}/g, '\n').trim(), 350);

  // 템플릿과 줄 구성/빈 줄을 1:1로 맞춤 (CRLF)
  const lines = [
    header,
    '',                       // 빈 줄
    titleLine1,
    titleLine2,
    '',                       // 빈 줄
    `1. 과정 : ${course || '-'}`,
    `2. 교재 : ${book || '-'}`,
    `3. 수업내용 : ${c || '-'}`,
    `4. 과제 : ${h || '-'}`,
    `5. 개별 피드백 : ${f || '-'}`,
    '',                       // 빈 줄
    "자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요.",
  ];
  return lines.join('\r\n');
}

// ====== (옵션) 강조표기 2줄 생성: 화면용. 본문 비교에는 영향 없음 ======
function makeTwoLineTitle(studentName, course, dateLabel, max = 23) {
  const ell = s => (String(s).length <= max ? String(s) : String(s).slice(0, max - 1) + '…');
  const line1 = ell(`${studentName || ''} 학생`);

  let line2 = `${course || ''} ${dateLabel || ''}`.trim();

  if (line2.length > max) {
    const noDow = String(dateLabel || '').replace(/\(.+?\)/, '').trim();
    line2 = `${course || ''} ${noDow}`.trim();
  }
  if (line2.length > max) {
    const repl = [
      ['개별맞춤수업','개별'], ['판서강의','판서'], ['방학특강','특강'],
      ['중등수학','중수'], ['고등수학','고수'], ['심화반','심화'], ['기본반','기본'],
    ];
    let c = String(course || '');
    for (const [a, b] of repl) c = c.replace(a, b);
    const noDow2 = String(dateLabel || '').replace(/\(.+?\)/, '').trim();
    line2 = `${c} ${noDow2}`.trim();
  }
  if (line2.length > max) {
    const mmdd = (String(dateLabel || '').match(/\d{4}\.(\d{2}\.\d{2})/) || [,''])[1] || String(dateLabel || '');
    line2 = `${course || ''} ${mmdd}`.trim();
  }
  if (line2.length > max) line2 = ell(line2);

  return `${line1}\n${line2}`;
}

module.exports = {
  buildDailyTemplateMessage,
  makeTwoLineTitle,
};
