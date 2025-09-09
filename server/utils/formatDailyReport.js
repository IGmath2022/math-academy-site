// server/utils/formatDailyReport.js
// 강조형 리포트용: 템플릿 문자열을 코드 상수로 보관 (ENV 불필요)

const REPORT_TITLE_TEMPLATE =
  '#{학생명} 학생\n#{과정} #{수업일자}';

const REPORT_BODY_TEMPLATE =
  "1. 과정 : #{과정}\n" +
  "2. 교재 : #{교재}\n" +
  "3. 수업내용 : #{수업요약}\n" +
  "4. 과제 : #{과제요약}\n" +
  "5. 개별 피드백 : #{피드백요약}\n\n" +
  "자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요.";

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
  const arr = _lines(text);
  if (arr.length <= maxLines) return arr.join(', ');
  return [...arr.slice(0, maxLines), `외 ${arr.length - maxLines}건`].join(', ');
}
function _fill(template = '', map = {}) {
  // #{키} 치환 — 키에 공백/한글 포함 허용
  return String(template || '').replace(/#\{([^}]+)\}/g, (_, k) => {
    const key = String(k).trim();
    return map[key] !== undefined && map[key] !== null ? String(map[key]) : '';
  });
}

/** 본문 요약값(길이 가드 포함) */
function buildSummaries({ content, homework, feedback }) {
  return {
    수업요약: _clip(String(content || '').replace(/\s+\n/g, ' ').trim(), 200),
    과제요약: _clip(_joinHomework(homework, 6), 260),
    피드백요약: _clip(String(feedback || '').replace(/\n{2,}/g, '\n').trim(), 500)
  };
}

/** 코드 상수 템플릿으로 강조타이틀/본문 생성 */
function makeReportTitleAndBody({
  학생명, 과정, 수업일자, 교재, content, homework, feedback
}) {
  const { 수업요약, 과제요약, 피드백요약 } = buildSummaries({ content, homework, feedback });

  const map = {
    학생명: 학생명 || '',
    과정: 과정 || '',
    수업일자: 수업일자 || '',
    교재: 교재 || '',
    수업요약,
    과제요약,
    피드백요약
  };

  const emtitle = _fill(REPORT_TITLE_TEMPLATE, map);
  const message = _fill(REPORT_BODY_TEMPLATE, map);
  return { emtitle, message };
}

/** (선택) 2줄 타이틀 축약 로직 */
function makeTwoLineTitle(studentName, course, dateLabel, max = 23) {
  const ell = s => (s.length <= max ? s : s.slice(0, max - 1) + '…');
  const line1 = ell(`${String(studentName || '').trim()} 학생`);

  let line2 = `${String(course || '').trim()} ${String(dateLabel || '').trim()}`.trim();
  if (line2.length > max) {
    const noDow = (dateLabel || '').replace(/\(.+?\)/, '').trim();
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
    const mmdd = ((dateLabel || '').match(/\d{4}\.(\d{2}\.\d{2})/) || [,''])[1] || dateLabel;
    line2 = `${String(course || '').trim()} ${mmdd}`.trim();
  }
  if (line2.length > max) line2 = ell(line2);
  return `${line1}\n${line2}`;
}

module.exports = {
  makeReportTitleAndBody,
  makeTwoLineTitle,
  buildSummaries
};
