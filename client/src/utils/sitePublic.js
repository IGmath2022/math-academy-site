// client/src/utils/sitePublic.js
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api";

export const SITE_SETTINGS_EVENT = "site-settings-updated";

// 로컬 스냅샷 키(첫 페인트 깜빡임 최소화)
const SNAPSHOT_KEY = "site_theme_snapshot_v1";

/* =========================
 * 테마/이벤트/공개설정 API
 * ========================= */

/** CSS 변수/데이터 속성으로 테마 적용 */
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

/** 저장 직후 NavBar 등에게 설정 변경됨 알리기 */
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

/** 최초 1회 프리페치/메모리 캐시 */
let _cache = null;
export async function ensurePublicSettingsLoaded() {
  if (_cache) return _cache;
  const j = await fetchPublicSiteSettings();
  _cache = j?.settings || null;
  return _cache;
}

/** 변경 이벤트 구독 유틸 */
export function subscribeSiteSettings(listener) {
  const handler = () => listener?.();
  try {
    window.addEventListener(SITE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, handler);
  } catch {
    return () => {};
  }
}

/** 슈퍼 설정 저장 시 스냅샷 보관(선택) */
export function persistThemeSnapshot(settings) {
  try {
    const snap = {
      site_theme_color: settings?.site_theme_color,
      site_theme_mode: settings?.site_theme_mode,
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

/** 앱 부팅 직후 가능한 빨리 호출 → 첫 페인트에 테마 즉시 적용 */
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

/* =========================
 * 공개 설정 훅
 * ========================= */

/**
 * usePublicSiteSettings
 * - 공개 사이트 설정을 가져와 state로 보관
 * - 최초 로드 시 테마 즉시 반영
 * - SITE_SETTINGS_EVENT 수신 시 자동 리프레시
 */
export function usePublicSiteSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firstLoadRef = useRef(true);

  const refresh = async () => {
    try {
      setError("");
      setLoading(true);
      const j = await fetchPublicSiteSettings(); // { ok, settings }
      const s = j?.settings || null;
      setSettings(s);

      // 테마 즉시 적용
      if (s) {
        applyTheme({
          site_theme_color: s.site_theme_color,
          site_theme_mode: s.site_theme_mode,
        });
        // 로컬 스냅샷 업데이트(다음 방문 첫 페인트용)
        persistThemeSnapshot({
          ...s,
          // 서버 public-settings에는 메뉴 토글이 문자열일 수도 있으니 boolean 보정
          menu_home_on: s.menu_home_on !== false && String(s.menu_home_on) !== "false",
          menu_blog_on: s.menu_blog_on !== false && String(s.menu_blog_on) !== "false",
          menu_materials_on: s.menu_materials_on !== false && String(s.menu_materials_on) !== "false",
          menu_contact_on: s.menu_contact_on !== false && String(s.menu_contact_on) !== "false",
        });
      }
    } catch (e) {
      setError("공개 설정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 첫 페인트 시 로컬 스냅샷으로 테마만이라도 즉시 적용
    if (firstLoadRef.current) {
      ensureThemeOnFirstPaint();
      firstLoadRef.current = false;
    }
    refresh();

    // 설정 변경 이벤트 수신 → 재조회
    const unsub = subscribeSiteSettings(() => {
      refresh();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { settings, loading, error, refresh };
}
