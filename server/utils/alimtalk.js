const axios = require('axios');
require('dotenv').config();

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    name_1: variables.name,           // #{name}
    type_1: variables.type,           // #{type}
    time_1: variables.time,           // #{time}
    automsg_1: variables.automsg || '', // #{automsg}
  };

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    console.log('알리고 응답:', res.data);
    if (res.data && res.data.code === 0) return true;
    else {
      console.error('알림톡 발송 실패:', res.data);
      return false;
    }
  } catch (e) {
    console.error('알림톡 전송 실패:', e?.response?.data || e);
    return false;
  }
};