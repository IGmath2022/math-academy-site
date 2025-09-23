// client/src/context/SiteSettingsContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "../api";

const KEY = "publicSettingsV1";

const SiteSettingsContext = createContext({ ready:false });

export function SiteSettingsProvider({ children }) {
  // 1) 로컬 캐시 즉시 적용 → 초기 깜빡임 방지
  const cached = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
  }, []);

  const [state, setState] = useState({
    ready: !!cached,
    menu: cached?.menu || { home:true, blog:true, materials:true, contact:true },
    theme: cached?.theme || { color:"#2d4373", mode:"light" },
    home: cached?.home || {
      sections: [
        { key:'hero', on:true },
        { key:'about', on:true },
        { key:'teachers', on:true },
        { key:'schedule', on:true },
        { key:'blog', on:true },
      ],
      hero: { title:"IG수학학원", subtitle:"학생의 꿈과 성장…", logoUrl:"" },
      about: { md:"" },
      blog_show: true,
    },
  });

  // 2) 백그라운드에서 최신값 가져와 갱신
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/site/public-settings`);
        const data = await res.json();
        if (!alive || !res.ok) return;
        setState({ ...data, ready:true });
        localStorage.setItem(KEY, JSON.stringify(data));
        // 테마 색 즉시 반영(선택)
        document.documentElement.style.setProperty('--theme-color', data?.theme?.color || '#2d4373');
      } catch {
        // 실패해도 캐시값으로 동작
        if (!state.ready) setState(s => ({ ...s, ready:true }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SiteSettingsContext.Provider value={state}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
