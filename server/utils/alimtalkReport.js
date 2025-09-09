// server/utils/alimtalkReport.js
// 등·하원 알림톡 구조를 그대로 따르는 "리포트 전용" 발송기

const axios = require('axios');

// 강조형 타이틀(2줄) — 등하원 방식 그대로, 변수만 리포트에 맞춤
// 1행: "#{name} 학생"
// 2행: "#{course} #{date}"
const TITLE_TEMPLATE =
  '#{name} 학생\n#{course} #{date}';

// 본문 — 승인 템플릿과 줄/콜론/띄어쓰기까지 맞춰주세요
const BODY_TEMPLATE =
  '1. 과정 : #{course}\n' +
  '2. 교재 : #{book}\n' +
  '3. 수업내용 : #{content}\n' +
  '4. 과제 : #{homework}\n' +
  '5. 개별 피드백 : #{feedback}\n\n' +
  "자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요.";

function fillTemplate(template, v = {}) {
  return String(template || '').replace(/#\{(\w+)\}/g, (_, k) => {
    const key = String(k);
    return v[key] != null ? String(v[key]) : '';
  });
}

// 알리고 버튼 JSON(WL) — 단일 버튼만 사용 (배열 형태로 직렬화)
function buildButtonJson(button) {
  if (!button) return undefined;
  const name   = button.name || '리포트 보기';
  const linkM  = button.url_mobile || button.linkMobile || button.linkM || '';
  const linkP  = button.url_pc     || button.linkPc     || button.linkP || linkM;
  if (!linkM && !linkP) return undefined;
  return JSON.stringify([{ name, linkType: 'WL', linkM, linkP }]);
}

/**
 * 리포트 알림톡 발송
 * @param {string} phone            수신자 휴대폰번호(숫자만)
 * @param {string} template_code    알리고 리포트용 템플릿 코드(강조형)
 * @param {object} variables        { name, course, date, book, content, homework, feedback, button?, senddate?, failover?, fsubject?, fmessage?, testMode? }
 *  - button: { name?, url_mobile, url_pc }  // 개인화 링크(모바일/PC)
 */
exports.sendReportAlimtalk = async (phone, template_code, variables = {}) => {
  // 1) 타이틀/본문 조립 (등하원과 동일한 방식 — emtitle_1 + message_1)
  const emtitle = fillTemplate(TITLE_TEMPLATE, {
    name:     variables.name     || '',
    course:   variables.course   || '',
    date:     variables.date     || ''
  });
  const message = fillTemplate(BODY_TEMPLATE, {
    course:   variables.course   || '',
    book:     variables.book     || '',
    content:  variables.content  || '',
    homework: variables.homework || '',
    feedback: variables.feedback || ''
  });

  // 2) 파라미터 — 등하원용과 동일 구조(굳이 subject_1 등 추가 안함)
  const params = {
    apikey:     process.env.ALIGO_API_KEY,
    userid:     process.env.ALIGO_USER_ID,
    senderkey:  process.env.ALIGO_SENDER_KEY,
    tpl_code:   template_code || process.env.DAILY_REPORT_TPL_CODE, // 없으면 ENV에서
    sender:     process.env.ALIGO_SENDER,

    receiver_1: phone,
    recvname_1: variables.name || '',

    emtitle_1:  emtitle,   // 강조형 타이틀
    message_1:  message    // 본문
  };

  // 3) 버튼(JSON) — 템플릿에 웹링크 버튼이 등록되어 있어도 함께 주면 대부분 안전
  const buttonJson = buildButtonJson(variables.button);
  if (buttonJson) params.button_1 = buttonJson;

  // 4) (선택) 예약/대체문자/테스트모드 — 필요시만
  if (variables.senddate)  params.senddate   = variables.senddate;   // 예: 202509051030
  if (variables.failover)  params.failover   = variables.failover;   // 'Y' | 'N'
  if (variables.fsubject)  params.fsubject_1 = variables.fsubject;
  if (variables.fmessage)  params.fmessage_1 = variables.fmessage;
  if (variables.testMode)  params.testMode   = variables.testMode;   // 'Y' | 'N'

  try {
    const form = new URLSearchParams(params);
    const res  = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    console.log('알리고 응답(리포트):', res.data);
    return !!(res.data && res.data.code === 0);
  } catch (e) {
    console.error('알림톡(리포트) 발송 실패:', e?.response?.data || e);
    return false;
  }
};
