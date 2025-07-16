const aligoapi = require('aligoapi');
require('dotenv').config();

const AuthData = {
  apikey: process.env.ALIGO_API_KEY,   // 알리고 API Key
  userid: process.env.ALIGO_USER_ID    // 알리고 사이트 로그인 ID
};

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // 치환 변수명 자동 치환: name_1, time_1, automsg_1 등
  const templateVars = {};
  Object.entries(variables).forEach(([k, v]) => {
    templateVars[`${k}_1`] = v;
  });

  // 알리고 알림톡 전송 파라미터 구성
  const body = {
    senderkey: process.env.ALIGO_SENDER_KEY,   // 발신프로필 키
    tpl_code: template_code,                   // 템플릿 코드 (예: UB_0082)
    sender: process.env.ALIGO_SENDER,          // 발신자번호 (카카오채널 연결번호)
    receiver_1: phone,                         // 수신자 핸드폰번호
    subject_1: '출결 알림',                    // 알림톡 제목 (옵션)
    message_1: '',                             // 템플릿 기반이므로 내용은 자동완성
    ...templateVars                            // 치환변수: name_1, time_1 등
  };

  // 대체문자(msg)는 automsg가 있으면 그걸 사용, 없으면 이름 등으로
  body.msg = variables.automsg || `${variables.name || ''} 학생의 등/하원 내역입니다.`;

  try {
    const result = await aligoapi.alimtalkSend({ body }, AuthData);

    // 공식 문서 기준: result.data.result_code === '1' 이어야 정상
    if (result && result.data && result.data.result_code === '1') {
      return true;
    } else {
      console.error('알림톡 전송 실패:', result);
      return false;
    }
  } catch (e) {
    console.error('알림톡 전송 실패:', e);
    return false;
  }
};