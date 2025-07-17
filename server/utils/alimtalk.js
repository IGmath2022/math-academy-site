const axios = require('axios');
require('dotenv').config();

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 알리고 알림톡 필수 파라미터
  const params = {
    key: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    sender: process.env.ALIGO_SENDER,         // 발신번호(카톡 채널 전화번호)
    senderkey: process.env.ALIGO_SENDER_KEY,  // 카카오 비즈니스 SenderKey
    tpl_code: template_code,                  // 예: UB_0082
    receiver_1: phone,                        // 수신자 번호 (010xxxx)
  };

  // 템플릿 변수 (name, type, time, automsg) 모두 변수명_1 형식으로!
  ['name', 'type', 'time', 'automsg'].forEach(k => {
    if (variables[k]) params[`${k}_1`] = variables[k];
  });

  // 제목/미리보기/본문 (템플릿에 따라 필수)
  params.subject_1 = 'IG수학 출결 알림'; // 제목
  params.message_1 =
    `IG수학입니다.\n` +
    `${variables.name || ''} 학생이 ${variables.type || ''} 하였습니다. (${variables.time || ''})\n` +
    `${variables.automsg || ''}\n\n- 본 메시지는 자동발송입니다.`;

  // 미리보기(선택, 알리고에는 따로 없음), 본문에 변수 치환되니 충분

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post(
      'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
      form
    );
    console.log('알리고 응답:', res.data);
    if (res.data && (res.data.code === '0' || res.data.code === 0)) {
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