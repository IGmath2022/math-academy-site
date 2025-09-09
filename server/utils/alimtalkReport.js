// server/utils/alimtalkReport.js
// 데일리 리포트(강조표기형) — 버튼 링크를 코드로 직접 치환하여 전송

const axios = require('axios');

const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';

// 2줄 강조 타이틀(템플릿과 동일)
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
].join('\n');

// 키 정규화(한/영 혼용 대비)
function norm(v = {}) {
  return {
    학생명:     v.학생명 ?? v.name ?? '',
    과정:       v.과정 ?? v.course ?? '',
    수업일자:   v.수업일자 ?? v.dateLabel ?? '',
    교재:       v.교재 ?? v.book ?? '',
    수업요약:   v.수업요약 ?? v.content ?? '',
    과제요약:   v.과제요약 ?? v.homework ?? '',
    피드백요약: v.피드백요약 ?? v.feedback ?? '',
    code:       v.code ?? ''
  };
}

function fill(tpl, kv) {
  return String(tpl)
    .replace(/#\{학생명\}/g, kv.학생명)
    .replace(/#\{과정\}/g, kv.과정)
    .replace(/#\{수업일자\}/g, kv.수업일자)
    .replace(/#\{교재\}/g, kv.교재)
    .replace(/#\{수업요약\}/g, kv.수업요약)
    .replace(/#\{과제요약\}/g, kv.과제요약)
    .replace(/#\{피드백요약\}/g, kv.피드백요약);
}

/**
 * 리포트 알림톡 전송(강조표기형 + WL 버튼)
 * 버튼 링크는 여기서 ${code}로 직접 완성해서 보냅니다.
 */
exports.sendReportAlimtalk = async (phone, templateCode, v = {}) => {
  const K = norm(v);

  const emtitle = fill(TITLE_TEMPLATE, K);
  const message = fill(BODY_TEMPLATE, K);

  const url = `${REPORT_BASE.replace(/\/+$/,'')}/r/${encodeURIComponent(K.code)}`;

  // 템플릿의 버튼 스펙과 동일(WL 1개). linkM/linkP에 완성 URL 삽입.
  const buttonJson = JSON.stringify({
    button: [{
      name: '리포트 보기',
      linkType: 'WL',
      linkM: url,
      linkP: url
    }]
  });

  const params = {
    apikey:    process.env.ALIGO_API_KEY,
    userid:    process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code:  templateCode,
    sender:    process.env.ALIGO_SENDER,

    receiver_1: phone,
    recvname_1: K.학생명,

    // 강조형 필드
    subject_1: 'IG수학 데일리 리포트', // 계정에 따라 필수인 경우 있음
    emtitle_1: emtitle,
    message_1: message,

    // 버튼 JSON(완성 URL) — ★ code_1는 보내지 않음
    button_1: buttonJson
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
