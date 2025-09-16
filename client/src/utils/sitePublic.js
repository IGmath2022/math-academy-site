// client/src/utils/sitePublic.js
import { API_URL } from "../api";

export const SITE_SETTINGS_EVENT = "site-settings-updated";

// 테마 적용: CSS 변수/데이터 속성으로 최소 반영
export function applyTheme({ site_theme_color, site_theme_mode }) {
  try {
    const root = document.documentElement;
    if (site_theme_color) {
      root.style.setProperty("--theme-primary", site_theme_color);
    }
    if (site_theme_mode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  } catch {
    // SSR 등 DOM 미존재 상황 무시
  }
}

// NavBar 등에서 다시 읽게 이벤트 발행
export function emitSiteSettingsUpdated() {
  try {
    window.dispatchEvent(new Event(SITE_SETTINGS_EVENT));
  } catch {
    // no-op
  }
}

// 공개 설정 조회(비로그인)
export async function fetchPublicSiteSettings() {
  const res = await fetch(`${API_URL}/api/site/public-settings`);
  if (!res.ok) throw new Error("public settings fetch failed");
  return res.json(); // { ok, settings }
}

// 최초 1회 프리페치/캐시 (선택 사용)
let _cache = null;
export async function ensurePublicSettingsLoaded() {
  if (_cache) return _cache;
  const j = await fetchPublicSiteSettings();
  _cache = j?.settings || null;
  return _cache;
}

// 변경 이벤트 구독 유틸 (선택 사용)
export function subscribeSiteSettings(listener) {
  const handler = () => listener?.();
  try {
    window.addEventListener(SITE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, handler);
  } catch {
    return () => {};
  }
}
