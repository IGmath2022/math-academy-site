const axios = require('axios');

/**
 * 카카오 알림톡 발송
 * @param {string} to - 수신번호 (01012345678)
 * @param {string} templateCode - 템플릿코드
 * @param {object} variables - 템플릿 치환 변수
 */
async function sendKakaoAlimTalk(to, templateCode, variables) {
  // 쿨SMS 예시
  const apiKey = process.env.COOLSMS_API_KEY;
  const apiSecret = process.env.COOLSMS_API_SECRET;
  const senderKey = process.env.KAKAO_SENDER_KEY; // 발신 프로필 키

  const res = await axios.post(
    'https://api.coolsms.co.kr/kakao/v1/messages',
    {
      to,
      from: process.env.SMS_FROM, // 발신번호
      text: variables.text,        // 치환된 메시지 (템플릿에 따라 달라짐)
      kakaoOptions: {
        pfId: senderKey,
        templateId: templateCode,
        variables,                 // 치환값
      }
    },
    {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      }
    }
  );
  return res.data;
}

module.exports = sendKakaoAlimTalk;