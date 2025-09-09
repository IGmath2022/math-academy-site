// server/utils/alimtalkReport.js
// 데일리 리포트(강조표기형) 전용. 템플릿 버튼(WL) 포함 전송.

const axios = require('axios');

// 2줄 강조 타이틀(템플릿과 동일 레이아웃)
const TITLE_TEMPLATE =
  '#{학생명} 학생\n' +
  '#{과정} #{수업일자}';

// 본문(템플릿과 100% 동일해야 함)
const BODY_TEMPLATE = [
  '1. 과정 : #{과정}',
  '2. 교재 : #{교재}',
  '3. 수업내용 : #{수업요약}',
  '4. 과제 : #{과제요약}',
  '5. 개별 피드백 : #{피드백요약}',
  '',
  "자세한 내용은 아래 '리포트 보기' 버튼을 눌러 확인해주세요."
].join('\n'); // 필요 시 '\r\n'로만 교체하면 됩니다.

function fill(tpl, v = {}) {
  return String(tpl)
    .replace(/#\{학생명\}/g, v.학생명 ?? '')
    .replace(/#\{과정\}/g, v.과정 ?? '')
    .replace(/#\{수업일자\}/g, v.수업일자 ?? '')
    .replace(/#\{교재\}/g, v.교재 ?? '')
    .replace(/#\{수업요약\}/g, v.수업요약 ?? '')
    .replace(/#\{과제요약\}/g, v.과제요약 ?? '')
    .replace(/#\{피드백요약\}/g, v.피드백요약 ?? '');
}

/**
 * 리포트 알림톡 전송(강조표기형 + WL 버튼)
 * @param {string} phone             수신자 번호
 * @param {string} templateCode      알리고 템플릿 코드(예: 'IG_DAILY_REPORT_V1')
 * @param {object} v                 템플릿 변수
 *   - 학생명, 과정, 수업일자, 교재, 수업요약, 과제요약, 피드백요약, code
 */
exports.sendReportAlimtalk = async (phone, templateCode, v = {}) => {
  const emtitle  = fill(TITLE_TEMPLATE, v);
  const message  = fill(BODY_TEMPLATE, v);

  // 템플릿에 등록한 버튼: 웹링크(WL)
  // 링크에 #{code} 변수 사용 -> 전송 시 code_1 로 치환값 전달
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
    recvname_1: v.학생명 ?? '',

    // 강조형 필드
    emtitle_1: emtitle,
    message_1: message,

    // 템플릿 버튼 스펙과 동일하게 전송(+ 변수 치환값)
    button_1: buttonJson,
    code_1:   String(v.code ?? ''),

    // (문서상 subject_1 필수 표기지만, 강조형에서는 미사용인 계정도 있음)
    // 문제될 경우만 아래 한 줄 활성화
    // subject_1: 'IG수학 데일리 리포트',
  };

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
