const axios = require('axios');
require('dotenv').config();

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 필수 파라미터 (항상 소문자!!)
  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USERID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    // 아래 두 개가 템플릿의 제목/메시지에 정확히 치환되도록
    subject_1: `${variables.name || ''}학생이 ${variables.type || ''}하였습니다`,
    message_1:
      `IG수학입니다.\n` +
      `${variables.name || ''} 학생이 ${variables.type || ''} 하였습니다. (${variables.time || ''})\n` +
      (variables.automsg ? `${variables.automsg}\n` : '') +
      `\n- 본 메시지는 자동발송입니다.`
  };

  // 템플릿에 #{name}, #{type}, #{time}, #{automsg} 변수로 등록되어 있으면 반드시 같이 넘겨야 함!
  if (variables.name) params.name_1 = variables.name;
  if (variables.type) params.type_1 = variables.type;
  if (variables.time) params.time_1 = variables.time;
  if (variables.automsg !== undefined) params.automsg_1 = variables.automsg;

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    console.log('알리고 응답:', res.data);
    if (res.data && String(res.data.code) === '0') {
      return true;
    } else {
      console.error('알림톡 발송 실패:', res.data);
      return false;
    }
  } catch (e) {
    console.error('알림톡 발송 예외:', e?.response?.data || e);
    return false;
  }
};