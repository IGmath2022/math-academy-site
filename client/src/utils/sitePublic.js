// client/src/utils/sitePublic.js
import { API_URL } from '../api';

const LS_KEY = 'site:publicSettings:v1';

// --- 캐시 로드(동기) ---
export function getCachedPublicSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j && j.settings) return j.settings;
    return null;
  } catch {
    return null;
  }
}

// --- 캐시 저장 ---
function setCachedPublicSettings(settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ settings }));
  } catch {}
}

// --- 테마 적용(즉시) ---
export function applyTheme({ site_theme_color = '#2d4373', site_theme_mode = 'light' } = {}) {
  try {
    const root = document.documentElement;
    root.style.setProperty('--brand', site_theme_color);
    root.setAttribute('data-theme', site_theme_mode === 'dark' ? 'dark' : 'light');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', site_theme_mode === 'dark' ? '#0b0f19' : '#ffffff');
  } catch {}
}

// --- 최초 페인트 전에 테마 적용(깜빡임 제거) ---
export function ensureThemeOnFirstPaint() {
  const cached = getCachedPublicSettings();
  if (cached) applyTheme(cached);
}

// --- 공개 설정 가져오기(네트워크) + 캐시 갱신 ---
export async function fetchPublicSiteSettings() {
  const r = await fetch(`${API_URL}/api/site/public-settings`);
  if (!r.ok) throw new Error('public settings fetch failed');
  const j = await r.json(); // { ok, settings }
  if (j?.ok && j.settings) {
    setCachedPublicSettings(j.settings);
    return j.settings;
  }
  throw new Error('public settings invalid');
}

// --- 저장 직후 NavBar 등에게 알리는 이벤트 ---
export function emitSiteSettingsUpdated() {
  window.dispatchEvent(new Event('site-settings-updated'));
}

// --- 훅: 캐시→즉시값 + 백그라운드 최신화 ---
import { useEffect, useState } from 'react';
export function usePublicSiteSettings() {
  const [settings, setSettings] = useState(() => getCachedPublicSettings());
  const [loading, setLoading] = useState(!settings);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const fresh = await fetchPublicSiteSettings();
        if (!alive) return;
        setSettings(fresh);
        setLoading(false);
        applyTheme(fresh);
      } catch {
        // 네트워크 실패해도 캐시 기반으로 계속
        setLoading(false);
      }
    })();

    const onUpdated = () => {
      const s = getCachedPublicSettings();
      if (s) {
        setSettings(s);
        applyTheme(s);
      }
    };
    window.addEventListener('site-settings-updated', onUpdated);

    return () => {
      alive = false;
      window.removeEventListener('site-settings-updated', onUpdated);
    };
  }, []);

  return { settings, loading };
}
