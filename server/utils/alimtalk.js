const axios = require('axios');

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 실제 알리고 API 파라미터에 맞춰 작성
  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code, // 예: UB_0082
    msg: variables.msg || '',
    receiver: phone,
    // 변수치환 등 추가
    ...variables
  };
  // 아래는 실제 API 연동에 맞게 고치세요
  try {
    await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', params);
    return true;
  } catch (e) {
    console.error('알림톡 전송 실패:', e?.response?.data || e);
    return false;
  }
};