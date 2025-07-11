const axios = require('axios');
require('dotenv').config(); // 혹시 app.js에서 이미 호출 중이면 중복불필요

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 알리고 알림톡 필수 파라미터
  const params = {
    key: process.env.ALIGO_API_KEY,
    user_id: process.env.ALIGO_USER_ID,
    sender: process.env.ALIGO_SENDER,            // 발신번호(카톡 채널 연결번호)
    senderkey: process.env.ALIGO_SENDER_KEY,     // 카카오 비즈니스 SenderKey
    tpl_code: template_code,                     // 예: UB_0082
    receiver_1: phone,                           // 수신자 번호
    // 치환 변수 세팅 (예시: "#{name}", "#{time}", "#{automsg}")
    // 알리고 API 문서에서 치환 변수는 변수명_1, 변수명_2 이런 식으로 명명됨
    // 예: "name_1": "홍길동", "time_1": "15:31"
  };

  // 알리고 API는 #{name}, #{time} 같은 템플릿 변수를
  // name_1, time_1 등으로 전달해야 함!
  for (const [k, v] of Object.entries(variables)) {
    params[`${k}_1`] = v;
  }

  // 대체문자(필수, 90byte 이내), 템플릿마다 변수에 따라 다르게
  params.msg = variables.automsg || variables.msg || `${variables.name || ''} 학생이 등/하원하였습니다.`;

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    // res.data : { result_code, message, ... }
    if (res.data && res.data.result_code === '1') {
      return true;
    } else {
      console.error('알림톡 전송 실패:', res.data);
      return false;
    }
  } catch (e) {
    console.error('알림톡 전송 실패:', e?.response?.data || e);
    return false;
  }
};