// /server/utils/alimtalk.js
const axios = require('axios');
require('dotenv').config();

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 알리고 알림톡 필수 파라미터 세팅
  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,                // 예: UB_0082
    sender: process.env.ALIGO_SENDER,       // 발신번호(카톡 채널 번호)
    receiver_1: phone,                      // 수신자 번호
    // ↓ 템플릿 치환 변수
    name_1: variables.name,
    type_1: variables.type,
    time_1: variables.time,
    automsg_1: variables.automsg || "",
  };

  // 템플릿 내용 "완전 일치" 조립
  params.message_1 =
`IG수학입니다.
${variables.name} 학생이 ${variables.type} 하였습니다.
(${variables.time})
${variables.automsg}
- 본 메세지는 자동발송입니다.`;

  // 요청 보내기
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