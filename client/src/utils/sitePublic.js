// client/src/utils/sitePublic.js
import { API_URL } from "../api";

export const SITE_SETTINGS_EVENT = "site-settings-updated";

// 로컬 스냅샷 키(첫 페인트 테마/메뉴 깜빡임 줄이기 용)
const SNAPSHOT_KEY = "site_theme_snapshot_v1";

/** 테마 적용: CSS 변수/데이터 속성으로 최소 반영 */
export function applyTheme({ site_theme_color, site_theme_mode }) {
  try {
    const root = document.documentElement;
    if (site_theme_color) {
      root.style.setProperty("--theme-primary", site_theme_color);
    }
    if (site_theme_mode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (site_theme_mode === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  } catch {
    // SSR 등 DOM 미존재 상황 무시
  }
}

/** 저장 즉시 NavBar 등에서 다시 읽게 이벤트 발행 */
export function emitSiteSettingsUpdated() {
  try {
    window.dispatchEvent(new Event(SITE_SETTINGS_EVENT));
  } catch {
    // no-op
  }
}

/** 공개 설정 조회(비로그인) */
export async function fetchPublicSiteSettings() {
  const res = await fetch(`${API_URL}/api/site/public-settings`);
  if (!res.ok) throw new Error("public settings fetch failed");
  return res.json(); // { ok, settings }
}

/** 최초 1회 프리페치/캐시 (선택 사용) */
let _cache = null;
export async function ensurePublicSettingsLoaded() {
  if (_cache) return _cache;
  const j = await fetchPublicSiteSettings();
  _cache = j?.settings || null;
  return _cache;
}

/** 변경 이벤트 구독 유틸 (선택 사용) */
export function subscribeSiteSettings(listener) {
  const handler = () => listener?.();
  try {
    window.addEventListener(SITE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, handler);
  } catch {
    return () => {};
  }
}

/** ⬇⬇⬇ 여기부터 ‘첫 페인트’ 테마 적용 관련 ⬇⬇⬇ */

/** 저장 시 스냅샷 보관(슈퍼 설정 저장 성공 이후 호출 권장) */
export function persistThemeSnapshot(settings) {
  try {
    const snap = {
      site_theme_color: settings?.site_theme_color,
      site_theme_mode: settings?.site_theme_mode,
      // 필요하면 메뉴 토글/홈 섹션도 함께 저장 가능
      menu_home_on: !!settings?.menu_home_on,
      menu_blog_on: !!settings?.menu_blog_on,
      menu_materials_on: !!settings?.menu_materials_on,
      menu_contact_on: !!settings?.menu_contact_on,
      home_sections: Array.isArray(settings?.home_sections) ? settings.home_sections : [],
      savedAt: Date.now(),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
  } catch {
    // no-op
  }
}

/** 앱 부팅 직후 가능한 한 빨리 호출해서 첫 페인트에 테마만이라도 적용 */
export function ensureThemeOnFirstPaint() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    applyTheme({
      site_theme_color: snap.site_theme_color,
      site_theme_mode: snap.site_theme_mode,
    });
    return true;
  } catch {
    return false;
  }
}
