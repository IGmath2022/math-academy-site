const aligoapi = require('aligoapi');
require('dotenv').config();

const AuthData = {
  apikey: process.env.ALIGO_API_KEY,
  userid: process.env.ALIGO_USER_ID
};

// 최초 서버 부팅 시 로그로 값 확인
console.log('ALIGO_API_KEY:', process.env.ALIGO_API_KEY);
console.log('ALIGO_USER_ID:', process.env.ALIGO_USER_ID);
console.log('ALIGO_SENDER_KEY:', process.env.ALIGO_SENDER_KEY);
console.log('ALIGO_SENDER:', process.env.ALIGO_SENDER);

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 템플릿 변수 매핑
  const templateVars = {};
  Object.entries(variables).forEach(([k, v]) => {
    templateVars[`${k}_1`] = v;
  });

  const body = {
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    ...templateVars
  };
  // 진단 로그
  console.log('알림톡 발송 BODY:', body);
  console.log('알림톡 발송 AuthData:', AuthData);

  try {
    const result = await aligoapi.alimtalkSend({ body }, AuthData);

    console.log('알리고 응답:', result);
    if (result && result.data && result.data.result_code === '1') {
      return true;
    } else {
      console.error('알림톡 전송 실패:', result);
      return false;
    }
  } catch (e) {
    console.error('알림톡 전송 실패 [Catch]:', e);
    return false;
  }
};