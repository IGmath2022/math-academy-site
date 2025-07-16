const axios = require('axios');

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    // 치환 변수 세팅
    ...Object.fromEntries(Object.entries(variables).map(([k, v]) => [`${k}_1`, v]))
  };
  // 필수! message_1
  params.message_1 = variables.automsg || variables.msg || `${variables.name || ''} 학생이 ${variables.type || ''} 처리되었습니다.`;

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('알리고 응답:', res.data);
    return res.data;
  } catch (e) {
    console.error('알림톡 전송 실패:', e?.response?.data || e);
    return false;
  }
};