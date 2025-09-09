// server/utils/alimtalkReport.js
// 리포트(강조표기형) 전용 알림톡 발송기 — 버튼은 템플릿 정의를 그대로 사용하고,
// 템플릿 변수(예: #{code})는 "<변수명>_1" 파라미터로 전달.

const axios = require('axios');

const DEFAULT_SUBJECT = 'IG수학 데일리 리포트';

/**
 * 리포트 알림톡 발송
 * @param {string} phone         수신자 번호(숫자만)
 * @param {string} templateCode  알리고 템플릿 코드 (강조표기형)
 * @param {object} vars          {
 *   emtitle: 최종 강조 타이틀(2줄 포함 가능),
 *   message: 최종 본문(템플릿과 100% 동일 포맷),
 *   name?: 수신자명(학생명),
 *   subject?: 제목(없으면 기본값),
 *   // 예약/대체문자/테스트모드(선택)
 *   senddate?, failover?, fsubject?, fmessage?, testMode?,
 *   // 템플릿 변수 주입(중요): 템플릿/버튼의 #{변수명}에 값을 넣기
 *   extraVars?: { [varName: string]: string }  // 예: { code: 'abcdef' }
 * }
 */
exports.sendReportAlimtalk = async (phone, templateCode, vars = {}) => {
  const emtitle = (vars.emtitle || '').toString();
  const message = (vars.message || '').toString();
  if (!emtitle || !message) {
    console.error('[alimtalkReport] emtitle/message 누락');
    return false;
  }

  const params = {
    apikey:    process.env.ALIGO_API_KEY,
    userid:    process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code:  templateCode || process.env.DAILY_REPORT_TPL_CODE,
    sender:    process.env.ALIGO_SENDER,

    receiver_1: phone,
    recvname_1: vars.name || '',

    // 명세상 subject_1 표시: 계정에 따라 필수 취급되므로 안전하게 포함
    subject_1: vars.subject || DEFAULT_SUBJECT,

    // 강조표기형 필드
    emtitle_1: emtitle,
    message_1: message,
    // ★중요: 버튼은 템플릿 정의를 사용 — 여기서 button_1은 보내지 않습니다★
  };

  // (선택) 예약/대체문자/테스트모드
  if (vars.senddate)  params.senddate   = vars.senddate;         // YYYYMMDDHHmm
  if (vars.failover)  params.failover   = vars.failover;         // 'Y' | 'N'
  if (vars.fsubject)  params.fsubject_1 = vars.fsubject;
  if (vars.fmessage)  params.fmessage_1 = vars.fmessage;
  if (vars.testMode)  params.testMode   = vars.testMode;         // 'Y' | 'N'

  // ★ 템플릿 변수 주입: #{변수명} → "<변수명>_1" 로 전달
  if (vars.extraVars && typeof vars.extraVars === 'object') {
    for (const [k, v] of Object.entries(vars.extraVars)) {
      // ex) #{code} → code_1
      params[`${k}_1`] = (v ?? '').toString();
    }
  }

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
