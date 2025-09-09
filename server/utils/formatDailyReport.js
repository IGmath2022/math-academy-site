// server/utils/formatDailyReport.js
/**
 * 일일 리포트용 제목/본문 포맷터
 * - lessonsController:  makeTwoLineTitle(), buildDailyTemplateBody()
 * - alimtalkReport:     makeReportTitleAndBody()  (타이틀+본문 한 번에)
 */

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

/**
 * 템플릿 본문과 동일한 구조로 생성
 * - course, book, content, homework, feedback 에 맞춰 1~5번 라인 구성
 */
function buildDailyTemplateBody({ course, book, content, homework, feedback }) {
  // 수업내용: 2문장/120자 권장
  const c = _clip(String(content || '').replace(/\s+\n/g, ' ').trim(), 120);
  // 과제: 최대 4개 항목 요약
  const h = _clip(_joinHomework(homework || '', 4), 180);
  // 피드백: 300~350자 권장
  const f = _clip(String(feedback || '').replace(/\n{2,}/g, '\n').trim(), 350);

  return [
    `1. 과정 : ${course || '-'}`,
    `2. 교재 : ${book || '-'}`,
    `3. 수업내용 : ${c || '-'}`,
    `4. 과제 : ${h || '-'}`,
    `5. 개별 피드백 : ${f || '-'}`,
  ].join('\n');
}

/**
 * 타이틀 2줄(각 23자 가드)
 *  1행: "{학생명} 학생"
 *  2행: "{과정} {YYYY.MM.DD(요일)}" → 길면 단계적 축약
 */
function makeTwoLineTitle(studentName, course, dateLabel, max = 23) {
  const ell = s => (String(s).length <= max ? String(s) : String(s).slice(0, max - 1) + '…');
  const line1 = ell(`${studentName || ''} 학생`);

  let line2 = `${course || ''} ${dateLabel || ''}`.trim();

  if (line2.length > max) {
    // 요일 제거
    const noDow = String(dateLabel || '').replace(/\(.+?\)/, '').trim();
    line2 = `${course || ''} ${noDow}`.trim();
  }
  if (line2.length > max) {
    // 과정 축약 규칙
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
    // 날짜 더 축약: YYYY.MM.DD → MM.DD
    const mmdd = (String(dateLabel || '').match(/\d{4}\.(\d{2}\.\d{2})/) || [,''])[1] || String(dateLabel || '');
    line2 = `${course || ''} ${mmdd}`.trim();
  }
  if (line2.length > max) line2 = ell(line2);

  return `${line1}\n${line2}`;
}

/**
 * 타이틀+본문을 한 번에 만들어 반환
 *  - alimtalkReport 등에서 사용
 */
function makeReportTitleAndBody({
  학생명, 과정, 수업일자, 교재, content, homework, feedback,
  titleMax = 23,
}) {
  const emtitle = makeTwoLineTitle(학생명 || '', 과정 || '', 수업일자 || '', titleMax);
  const message = buildDailyTemplateBody({
    course:   과정    || '-',
    book:     교재    || '-',
    content:  content || '',
    homework: homework|| '',
    feedback: feedback|| '',
  });
  return { emtitle, message };
}

module.exports = {
  buildDailyTemplateBody,
  makeTwoLineTitle,
  makeReportTitleAndBody,
};
