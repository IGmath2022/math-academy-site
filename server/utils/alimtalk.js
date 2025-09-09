// server/utils/alimtalk.js
const axios = require('axios');
const { makeReportTitleAndBody } = require('./formatDailyReport');

// 출결/리포트 기본 제목(알리고 subject_1 필수)
const ATTEND_SUBJECT = 'IG수학 출결 알림';
const REPORT_SUBJECT = 'IG수학 데일리 리포트';

// (하위호환) 출결용 텍스트 템플릿
const TITLE_TEMPLATE = '#{name}학생이 #{type}하였습니다';
const BODY_TEMPLATE = `IG수학입니다.
#{name} 학생이 #{type} 하였습니다. (#{time})
#{automsg}

- 본 메시지는 자동발송입니다.`;

/** 간단 치환 (출결용) */
function fill(template, vars = {}) {
  return String(template || '')
    .replace('#{name}', vars.name ?? '')
    .replace('#{type}', vars.type ?? '')
    .replace('#{time}', vars.time ?? '')
    .replace('#{automsg}', vars.automsg ?? '');
}

/** 버튼 JSON (Aligo WL 규격: 배열 문자열, linkM/linkP 키) */
function buildButtonJson(buttonOrArray) {
  const toWL = (b = {}) => {
    const name = b.name || '자세히 보기';
    const linkM = b.linkM || b.url_mobile || b.linkMobile || b.urlMobile || '';
    const linkP = b.linkP || b.url_pc || b.linkPc || b.urlPc || linkM || '';
    return { name, linkType: 'WL', linkM, linkP };
  };
  const btns = Array.isArray(buttonOrArray) ? buttonOrArray.map(toWL) : [toWL(buttonOrArray)];
  return JSON.stringify(btns);
}

// 리포트 템플릿 여부 판단: .env(DR 템플릿 코드) || vars.isReport 플래그
function isDailyReport(template_code, vars = {}) {
  const daily = process.env.DAILY_REPORT_TPL_CODE;
  if (vars.isReport === true) return true;
  return daily && template_code === daily;
}

function resolveSubject(template_code, vars = {}) {
  return isDailyReport(template_code, vars)
    ? (vars.subject || REPORT_SUBJECT)
    : (vars.subject || ATTEND_SUBJECT);
}

/**
 * 알리고 알림톡 발송 (단건, receiver_1 전송)
 *
 * vars 옵션:
 *  - name, type, time, automsg            // 출결용 치환 값
 *  - subject                              // subject_1 (없으면 기본값)
 *  - emtitle, message                     // 리포트 완성본(우선 사용)
 *  - course, dateLabel, book, content, homework, feedback  // 리포트 자동생성용 원자료
 *  - button / buttons                     // {name, url_mobile, url_pc} or 배열
 *  - senddate                             // 예약일(알리고 포맷 문자열 그대로)
 *  - failover ('Y'|'N'), fsubject, fmessage
 *  - testMode ('Y'|'N')                   // 테스트 모드 (기본 N)
 *  - isReport (boolean)                   // 템플릿코드 비교 대신 강제 리포트 처리 플래그
 */
exports.sendAlimtalk = async (phone, template_code, vars = {}) => {
  // === 제목(subject_1) — 필수 ===
  const subject = resolveSubject(template_code, vars);

  let emtitle;   // 강조형에서 사용
  let message;   // 본문

  if (isDailyReport(template_code, vars)) {
    // 리포트 템플릿(강조형): emtitle/message
    if (vars.emtitle && vars.message) {
      emtitle = String(vars.emtitle);
      message = String(vars.message);
    } else {
      const { emtitle: t, message: m } = makeReportTitleAndBody({
        학생명: vars.name || '',
        과정: vars.course || '',
        수업일자: vars.dateLabel || '',
        교재: vars.book || '',
        content: vars.content || '',
        homework: vars.homework || '',
        feedback: vars.feedback || ''
      });
      emtitle = t;
      message = m;
    }
  } else {
    // 출결/기타 템플릿
    emtitle = fill(TITLE_TEMPLATE, vars);
    message = fill(BODY_TEMPLATE, vars);
  }

  const params = {
    // === 인증/템플릿/발신 ===
    apikey:     process.env.ALIGO_API_KEY,
    userid:     process.env.ALIGO_USER_ID,
    senderkey:  process.env.ALIGO_SENDER_KEY,
    tpl_code:   template_code,
    sender:     process.env.ALIGO_SENDER,

    // === 수신자(단건) ===
    receiver_1: phone,
    recvname_1: vars.name ?? '',

    // === 제목/본문/강조제목 ===
    subject_1:  subject,     // ★ 필수
    message_1:  message,
  };

  // 강조형이면 emtitle_1 반드시 추가
  if (isDailyReport(template_code, vars) || vars.emtitle) {
    params.emtitle_1 = emtitle;
  }

  // 버튼(웹링크) — 템플릿에 버튼이 있어도 button_1을 함께 주는 편이 안전
  if (vars.button || vars.buttons) {
    const src = vars.buttons || vars.button;
    params.button_1 = buildButtonJson(src);
  }

  // === 예약발송 ===
  if (vars.senddate) {
    // 알리고 콘솔 포맷(예: YYYYMMDDHHmm) 그대로 넘겨주세요.
    params.senddate = vars.senddate;
  }

  // === 실패시 대체문자 ===
  if (vars.failover === 'Y') {
    params.failover   = 'Y';
    if (vars.fsubject)  params.fsubject_1  = vars.fsubject;
    if (vars.fmessage)  params.fmessage_1  = vars.fmessage;
  } else if (vars.failover === 'N') {
    params.failover   = 'N';
  }

  // === 테스트모드 ===
  params.testMode = (vars.testMode || process.env.ALIGO_TESTMODE || 'N') === 'Y' ? 'Y' : 'N';

  try {
    // https 프로토콜, POST
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    console.log('알리고 응답:', res.data);
    return !!(res.data && res.data.code === 0);
  } catch (e) {
    console.error('알림톡 발송 실패:', e?.response?.data || e);
    return false;
  }
};
