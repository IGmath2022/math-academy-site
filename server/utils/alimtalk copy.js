const axios = require('axios');

const TITLE_TEMPLATE = '#{name}학생이 #{type}하였습니다';
const BODY_TEMPLATE = `IG수학입니다.
#{name} 학생이 #{type} 하였습니다. (#{time})
#{automsg}

- 본 메시지는 자동발송입니다.`;

function fillTemplate(template, variables = {}) {
  return template
    .replace('#{name}', variables.name ?? '')
    .replace('#{type}', variables.type ?? '')
    .replace('#{time}', variables.time ?? '')
    .replace('#{automsg}', variables.automsg ?? '');
}

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  const emtitle = fillTemplate(TITLE_TEMPLATE, variables);   // 강조표기형 타이틀
  const message = fillTemplate(BODY_TEMPLATE, variables);

  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    recvname_1: variables.name ?? '',
    emtitle_1: emtitle,        // ← subject_1이 아니라 emtitle_1로 반드시 입력!
    message_1: message,
    // button_1 등 필요시 추가
  };

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    console.log("알리고 응답:", res.data);
    if (res.data && res.data.code === 0) {
      return true;
    } else {
      console.error("알림톡 발송 실패:", res.data);
      return false;
    }
  } catch (e) {
    console.error("알림톡 발송 실패:", e?.response?.data || e);
    return false;
  }
};