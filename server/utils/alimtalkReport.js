// server/utils/alimtalkReport.js
// 데일리 리포트(강조표기형) 전용: 템플릿 본문/버튼과 100% 동일 구조 + CRLF + subject_1 포함

const axios = require('axios');

// 2줄 강조 타이틀(템플릿과 동일 레이아웃)
const TITLE_TEMPLATE =
  '#{학생명} 학생\r\n' +
  '#{과정} #{수업일자}';

// 본문(알리고 템플릿 본문과 줄/개행까지 동일해야 함)
const BODY_TEMPLATE = [
  '1. 과정 : #{과정}',
  '2. 교재 : #{교재}',
  '3. 수업내용 : #{수업요약}',
  '4. 과제 : #{과제요약}',
  '5. 개별 피드백 : #{피드백요약}',
  '',
  "자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요."
].join('\r\n');

// ──────────────────────────────────────────────
// 키 정규화: 한글/영문 어느 쪽으로 보내도 치환되게 통일
function normalizeVars(v = {}) {
  return {
    학생명:     v.학생명 ?? v.name ?? v.studentName ?? '',
    과정:       v.과정 ?? v.course ?? '',
    수업일자:   v.수업일자 ?? v.dateLabel ?? v.date ?? '',
    교재:       v.교재 ?? v.book ?? '',
    수업요약:   v.수업요약 ?? v.content ?? v.summary ?? '',
    과제요약:   v.과제요약 ?? v.homework ?? '',
    피드백요약: v.피드백요약 ?? v.feedback ?? '',
    code:       v.code ?? v.id ?? ''
  };
}

function fill(tpl, raw = {}) {
  const v = normalizeVars(raw);
  return String(tpl)
    .replace(/#\{학생명\}/g, v.학생명)
    .replace(/#\{과정\}/g, v.과정)
    .replace(/#\{수업일자\}/g, v.수업일자)
    .replace(/#\{교재\}/g, v.교재)
    .replace(/#\{수업요약\}/g, v.수업요약)
    .replace(/#\{과제요약\}/g, v.과제요약)
    .replace(/#\{피드백요약\}/g, v.피드백요약);
}

/**
 * 리포트 알림톡 전송(강조표기형 + WL 버튼)
 * @param {string} phone        수신자 번호
 * @param {string} templateCode 알리고 템플릿 코드 (예: 'IG_DAILY_REPORT_V1')
 * @param {object} v            템플릿 변수(한글/영문 키 아무거나)
 */
exports.sendReportAlimtalk = async (phone, templateCode, v = {}) => {
  const nv       = normalizeVars(v);
  const emtitle  = fill(TITLE_TEMPLATE, nv);
  const message  = fill(BODY_TEMPLATE, nv);

  // 템플릿에 등록된 버튼(JSON) - WL 링크에 #{code} 사용
  const buttonJson = JSON.stringify({
    button: [{
      name: '리포트 보기',
      linkType: 'WL',
      linkM: 'https://ig-math-2022.onrender.com/r/#{code}',
      linkP: 'https://ig-math-2022.onrender.com/r/#{code}'
    }]
  });

  const params = {
    apikey:    process.env.ALIGO_API_KEY,
    userid:    process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code:  templateCode,
    sender:    process.env.ALIGO_SENDER,

    receiver_1: phone,
    recvname_1: nv.학생명,

    // 강조형 필드
    subject_1: 'IG수학 데일리 리포트', // 일부 계정에서 필수 취급
    emtitle_1: emtitle,
    message_1: message,

    // 버튼 + 변수치환
    button_1: buttonJson,
    code_1:   String(nv.code || ''),   // #{code} 치환
  };

  try {
    const form = new URLSearchParams(params);
    const res  = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    console.log('[ALIMTALK][REPORT] payload:', { emtitle, message, code: params.code_1 });
    console.log('[ALIMTALK][REPORT] resp:', res.data);
    return !!(res.data && res.data.code === 0);
  } catch (e) {
    console.error('[ALIMTALK][REPORT] FAIL:', e?.response?.data || e);
    return false;
  }
};
