const axios = require('axios');
require('dotenv').config(); // 보통 app.js에서 1회만 호출 (중복은 무해)

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 알리고 필수 파라미터 세팅
  const params = {
    key: process.env.ALIGO_API_KEY,
    user_id: process.env.ALIGO_USER_ID,
    sender: process.env.ALIGO_SENDER,            // 발신번호(채널번호)
    senderkey: process.env.ALIGO_SENDER_KEY,     // 카카오 SenderKey
    tpl_code: template_code,                     // 템플릿 코드 (예: UB_0082)
    receiver_1: phone,                           // 수신자 번호
  };
  console.log('ALIGO_USER_ID:', process.env.ALIGO_USER_ID);
  console.log('알림톡 파라미터', params);
  // 템플릿 치환 변수 -> API명 규칙 맞춰 동적 변환
  // 예시: name_1: "홍길동", type_1: "등원", time_1: "14:31", automsg_1: "자동 하원 처리"
  Object.entries(variables).forEach(([k, v]) => {
    params[`${k}_1`] = v;
  });

  // 필수: 대체문자(90바이트 이내, 빈값 가능하나 최대한 채울 것)
  params.msg = variables.automsg || variables.msg || `${variables.name || ''} 학생이 등/하원 하였습니다.`;

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', form);
    // result_code === '1'이면 성공
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