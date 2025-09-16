// client/src/utils/sitePublic.js
import { API_URL } from "../api";

/** 공개 전역 설정 조회 */
export async function fetchPublicSiteSettings() {
  const r = await fetch(`${API_URL}/api/site/public-settings`);
  if (!r.ok) throw new Error("fetchPublicSiteSettings failed");
  return r.json(); // { ok: true, settings: {...} }
}

/** CSS 변수에 테마 적용 */
export function applyTheme(settings) {
  const root = document.documentElement;
  const primary = settings?.site_theme_color || "#2d4373";
  const mode = settings?.site_theme_mode === "dark" ? "dark" : "light";

  root.style.setProperty("--theme-primary", primary);
  root.style.setProperty("--nav-bg", primary);
  root.style.setProperty("--nav-text", "#ffffff");
  document.body.setAttribute("data-theme", mode);
}

/** 저장 후 전역에 알림 -> NavBar가 재로딩 */
export function emitSiteSettingsUpdated() {
  window.dispatchEvent(new Event("site-settings-updated"));
}
