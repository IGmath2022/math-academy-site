// client/src/api.js
// CRA(Create React App) 기준: REACT_APP_ 접두어만 클라이언트 번들에 주입됩니다.

import axios from "axios";
import { logApiError } from "./utils/errorLogger";

// 1) .env에서 우선 읽기
const fromEnv = (process.env.REACT_APP_API_URL || "").trim();

// 2) 로컬 개발이면 기본값 http://localhost:4000 추론
function inferLocal() {
  const host = window?.location?.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:4000";
  }
  return null;
}

// 3) 최종 폴백(운영 API)
const FALLBACK_PROD = "https://math-academy-server.onrender.com";

// 우선순위: env > 로컬추론 > 운영폴백
const picked = fromEnv || inferLocal() || FALLBACK_PROD;

// 슬래시 정리 (끝 슬래시 제거해서 // 방지)
export const API_URL = picked.replace(/\/+$/, "");

// 개발일 때만 로깅
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("[API_URL]", API_URL);
}

// API 에러 로깅을 위한 axios 인스턴스
export const api = axios.create({ baseURL: API_URL });

// 응답 인터셉터: API 에러 자동 로깅
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const endpoint = error.config?.url || 'unknown';
    logApiError(error, endpoint);
    return Promise.reject(error);
  }
);