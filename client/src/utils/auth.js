// client/src/utils/auth.js
const KEY_T = "token";
const KEY_R = "role";

// 세션 저장: 브라우저 탭/창을 닫으면 사라짐
export function setAuth({ token, role }) {
  if (token) sessionStorage.setItem(KEY_T, token);
  if (role) sessionStorage.setItem(KEY_R, role);
  // 과거 로컬스토리지 잔재 제거(착시 방지)
  localStorage.removeItem(KEY_T);
  localStorage.removeItem(KEY_R);
}

export function clearAuth() {
  sessionStorage.removeItem(KEY_T);
  sessionStorage.removeItem(KEY_R);
  localStorage.removeItem(KEY_T);
  localStorage.removeItem(KEY_R);
}

export function getToken() {
  // 호환성: 혹시 남아있을 수 있는 로컬 토큰보다 세션 우선
  return sessionStorage.getItem(KEY_T) || localStorage.getItem(KEY_T) || "";
}

export function getRole() {
  return sessionStorage.getItem(KEY_R) || "";
}
