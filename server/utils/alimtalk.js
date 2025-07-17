const axios = require('axios');

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 알리고 알림톡 필수 파라미터
  const params = {
    apikey: process.env.ALIGO_API_KEY,        // ← 정확히 변수명 맞춰야 함
    userid: process.env.ALIGO_USERID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,                  // 예: UB_0082
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    recvname_1: variables.name || '',         // 이름 변수, 없으면 빈값
    subject_1: `IG수학 출결 알림\n${variables.name}학생이 ${variables.type}하였습니다`, // 템플릿 '제목' 부분
    message_1: `IG수학입니다.\n${variables.name} 학생이 ${variables.type} 하였습니다. (${variables.time})\n${variables.automsg || ''}\n\n- 본 메시지는 자동발송입니다.`
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