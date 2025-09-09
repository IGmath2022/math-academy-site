// server/utils/formatDailyReport.js

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
function _joinHomework(text = '', maxLines = 6) {
  // 한 줄씩 잘라 최대 maxLines개만 노출, 나머지는 "외 N건"
  const arr = _lines(text);
  if (arr.length <= maxLines) return arr.join(', ');
  return [...arr.slice(0, maxLines), `외 ${arr.length - maxLines}건`].join(', ');
}

/**
 * 템플릿 본문과 100% 동일한 구조로 조립
 * ※ 콜론 앞뒤 공백/줄바꿈까지 템플릿과 같아야 함
 *
 * 템플릿(승인본) 예:
 * 1. 과정 : #{과정}
 * 2. 교재 : #{교재}
 * 3. 수업내용 : #{수업요약}
 * 4. 과제 : #{과제요약}
 * 5. 개별 피드백 : #{피드백요약}
 *
 * 자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요.
 */
function buildDailyTemplateBody({ course, book, content, homework, feedback }) {
  // 길이 상향(짤림 방지): 내용 200자, 과제 260자, 피드백 500자
  const c = _clip(String(content || '').replace(/\s+\n/g, ' ').trim(), 200);
  const h = _clip(_joinHomework(homework, 6), 260);
  const f = _clip(String(feedback || '').replace(/\n{2,}/g, '\n').trim(), 500);

  const body = [
    `1. 과정 : ${course || '-'}`,
    `2. 교재 : ${book || '-'}`,
    `3. 수업내용 : ${c || '-'}`,
    `4. 과제 : ${h || '-'}`,
    `5. 개별 피드백 : ${f || '-'}`
  ].join('\n');

  // ★ 템플릿 고정 문구(필수) — 이 줄이 빠지면 불일치로 반려됩니다.
  const tail = `\n\n자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요.`;

  return body + tail;
}

/** 타이틀 2줄(각 23자 가드) */
function makeTwoLineTitle(studentName, course, dateLabel, max = 23) {
  const ell = s => (s.length <= max ? s : s.slice(0, max - 1) + '…');
  const line1 = ell(`${String(studentName || '').trim()} 학생`);

  // 2줄차 축약 규칙
  let line2 = `${String(course || '').trim()} ${String(dateLabel || '').trim()}`.trim();

  if (line2.length > max) {
    const noDow = (dateLabel || '').replace(/\(.+?\)/, '').trim(); // 요일 제거
    line2 = `${String(course || '').trim()} ${noDow}`.trim();
  }
  if (line2.length > max) {
    const repl = [
      ['개별맞춤수업','개별'], ['판서강의','판서'], ['방학특강','특강'],
      ['중등수학','중수'], ['고등수학','고수'], ['심화반','심화'], ['기본반','기본']
    ];
    let c = String(course || '');
    for (const [a,b] of repl) c = c.replace(a,b);
    line2 = `${c} ${String(dateLabel || '').replace(/\(.+?\)/, '').trim()}`.trim();
  }
  if (line2.length > max) {
    // 날짜 더 축약: MM.DD
    const mmdd = ((dateLabel || '').match(/\d{4}\.(\d{2}\.\d{2})/) || [,''])[1] || dateLabel;
    line2 = `${String(course || '').trim()} ${mmdd}`.trim();
  }
  if (line2.length > max) line2 = ell(line2);

  return `${line1}\n${line2}`;
}

module.exports = { buildDailyTemplateBody, makeTwoLineTitle };
