const aligoapi = require('aligoapi');
require('dotenv').config();

// 알리고 기본 인증 데이터 (환경변수에서 로드)
const AuthData = {
  apikey: process.env.ALIGO_API_KEY,
  userid: process.env.ALIGO_USER_ID
};

/**
 * 알리고 알림톡 전송 util (aligoapi npm 모듈 기반)
 * @param {string} phone - 수신자 번호 (ex: 01012345678)
 * @param {string} template_code - 템플릿 코드 (ex: UB_0082)
 * @param {object} variables - { name, type, time, automsg }
 * @returns {Promise<boolean>} 성공시 true
 */
exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  const req = {
    body: {
      senderkey: process.env.ALIGO_SENDER_KEY, // 발신프로필 키
      tpl_code: template_code,
      sender: process.env.ALIGO_SENDER, // 대표발신번호(카카오 채널 등록된 번호)
      receiver_1: phone,
      subject_1: 'IG수학 출결 알림',
      message_1: '', // 실제 템플릿에는 치환변수가 들어가므로 공란 또는 샘플텍스트
      ...Object.fromEntries(Object.entries(variables).map(([k, v]) => [`${k}_1`, v])),
    }
  };

  // 대체문자 필요시 msg 세팅
  if (variables.automsg) req.body.msg = variables.automsg;

  try {
    const result = await aligoapi.alimtalkSend(req, AuthData);
    if (result && result.data && result.data.result_code === '1') {
      return true;
    } else {
      console.error('알림톡 전송 실패:', result);
      return false;
    }
  } catch (e) {
    console.error('알림톡 전송 실패:', e?.response?.data || e);
    return false;
  }
};