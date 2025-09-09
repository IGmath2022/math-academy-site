// server/utils/alimtalk.js
const axios = require('axios');

const TITLE_TEMPLATE = '#{name}학생이 #{type}하였습니다';
const BODY_TEMPLATE = `IG수학입니다.
#{name} 학생이 #{type} 하였습니다. (#{time})
#{automsg}

- 본 메시지는 자동발송입니다.`;

/** 기존 등/하원용 기본 치환 */
function fillTemplate(template, variables = {}) {
  return template
    .replace('#{name}', variables.name ?? '')
    .replace('#{type}', variables.type ?? '')
    .replace('#{time}', variables.time ?? '')
    .replace('#{automsg}', variables.automsg ?? '');
}

/** 버튼 파라미터 정규화 -> 알리고 규격(JSON 문자열) 생성
 *  - 입력 예:
 *    { name:'리포트 보기', url_mobile:'https://...', url_pc:'https://...' }
 *    { name:'리포트 보기', linkM:'https://...', linkP:'https://...' }
 *    { name:'리포트 보기', linkMobile:'https://...', linkPc:'https://...' }
 *  - 출력: button_1 = '[{ "name":"...", "linkType":"WL", "linkM":"...", "linkP":"..." }]'
 */
function buildButtonJson(buttonOrArray) {
  const toWL = (b = {}) => {
    const name = b.name || '자세히 보기';
    const linkM = b.linkM || b.url_mobile || b.linkMobile || b.urlMobile || '';
    const linkP = b.linkP || b.url_pc || b.linkPc || b.urlPc || linkM || '';
    return { name, linkType: 'WL', linkM, linkP };
  };

  const btns = Array.isArray(buttonOrArray)
    ? buttonOrArray.map(toWL)
    : [toWL(buttonOrArray)];

  return JSON.stringify(btns);
}

exports.sendAlimtalk = async (phone, template_code, variables = {}) => {
  // === 기본(출결)용 텍스트 생성 ===
  const defaultTitle = fillTemplate(TITLE_TEMPLATE, variables);
  const defaultMessage = fillTemplate(BODY_TEMPLATE, variables);

  // === 오버라이드 지원(일일 리포트 등) ===
  // - variables.emtitle   : 강조 타이틀(두 줄 포함 가능, 템플릿 승인 문구와 동일해야 함)
  // - variables.message   : 본문 전체(템플릿 승인 문구와 100% 일치 + 변수치환 완료)
  // - variables.emsubtitle: (계정에 필드가 열려있을 경우) 강조 서브타이틀
  // - variables.button    : {name, url_mobile, url_pc} 등 → 버튼 JSON 자동 변환
  const emtitle = variables.emtitle || defaultTitle;
  const message = variables.message || defaultMessage;

  const params = {
    apikey: process.env.ALIGO_API_KEY,
    userid: process.env.ALIGO_USER_ID,
    senderkey: process.env.ALIGO_SENDER_KEY,
    tpl_code: template_code,
    sender: process.env.ALIGO_SENDER,
    receiver_1: phone,
    recvname_1: variables.name ?? '',
    // 강조표기형: subject_1이 아니라 emtitle_1 사용
    emtitle_1: emtitle,
    message_1: message,
  };

  // (선택) 서브타이틀 필드가 계정에 활성화되어 있다면 사용
  if (variables.emsubtitle) {
    params.emsubtitle_1 = variables.emsubtitle;
  }

  // (선택) 버튼 지원 — 알리고 WL 규격 (linkM/linkP)
  if (variables.button || variables.buttons) {
    const src = variables.buttons || variables.button;
    params.button_1 = buildButtonJson(src);
  }

  try {
    const form = new URLSearchParams(params);
    const res = await axios.post(
      'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
      form
    );
    console.log('알리고 응답:', res.data);
    return !!(res.data && res.data.code === 0);
  } catch (e) {
    console.error('알림톡 발송 실패:', e?.response?.data || e);
    return false;
  }
};
