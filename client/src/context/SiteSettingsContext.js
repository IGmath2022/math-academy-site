// client/src/context/SiteSettingsContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "../api";

const KEY = "publicSettingsV1";

const HOME_SECTION_KEYS = ["hero", "about", "schedule", "teachers", "blog"];
const HOME_SECTION_KEY_NORMALIZE = {
  stats: "schedule",
  statistics: "schedule",
  features: "about",
  testimonials: "teachers",
  contact: "schedule",
  cta: "blog",
};

const DEFAULT_MENU = {
  home: true,
  news: true,
  blog: true,
  materials: true,
  contact: true,
};

const DEFAULT_THEME = {
  color: "#2d4373",
  mode: "light",
  primary: "#2d4373",
  secondary: "#f5f7fb",
  accent: "#226ad6",
  fonts: {
    title: "Noto Sans KR",
    body: "system-ui",
  },
};

const DEFAULT_HOME = {
  sections: HOME_SECTION_KEYS.map((key) => ({ key, on: true })),
  hero: { title: "IG수학학원", subtitle: "학생의 성장을 돕는 맞춤 수학 전문 학원", logoUrl: "" },
  about: { md: "학생 맞춤 커리큘럼으로 기초부터 실전까지 책임집니다." },
  blog_show: true,
};

const DEFAULT_BRANDING = {
  academy_name: "IG수학학원",
  principal_name: "홍길동",
  academy_address: "서울특별시 강남구 학원로 24, 5층",
  academy_phone: "02-563-2925",
  academy_email: "info@igmath.co.kr",
  founded_year: "2020",
  academy_description: "학생 개별 맞춤 전략과 체계적인 수업으로 실력을 끌어 올립니다.",
};

const DEFAULT_STATE = {
  ready: false,
  menu: DEFAULT_MENU,
  theme: DEFAULT_THEME,
  home: DEFAULT_HOME,
  branding: DEFAULT_BRANDING,
};

const SiteSettingsContext = createContext(DEFAULT_STATE);

const toBool = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const sanitizeStr = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const trimmed = String(value).trim();
  return trimmed || fallback;
};

const normalizeSections = (list) => {
  const map = new Map();
  (Array.isArray(list) ? list : []).forEach((item) => {
    const key = HOME_SECTION_KEY_NORMALIZE[item.key] || item.key;
    if (HOME_SECTION_KEYS.includes(key) && !map.has(key)) {
      map.set(key, !!item.on);
    }
  });
  return HOME_SECTION_KEYS.map((key) => ({ key, on: map.has(key) ? map.get(key) : true }));
};

const mapSettingsToState = (raw) => {
  const menu = {
    home: toBool(raw?.menu_home_on, DEFAULT_MENU.home),
    news: toBool(raw?.menu_news_on, DEFAULT_MENU.news),
    blog: toBool(raw?.menu_blog_on, DEFAULT_MENU.blog),
    materials: toBool(raw?.menu_materials_on, DEFAULT_MENU.materials),
    contact: toBool(raw?.menu_contact_on, DEFAULT_MENU.contact),
  };

  const theme = {
    color: sanitizeStr(raw?.site_theme_color, DEFAULT_THEME.color),
    mode: raw?.site_theme_mode === "dark" ? "dark" : DEFAULT_THEME.mode,
    primary: sanitizeStr(raw?.primary_color, sanitizeStr(raw?.site_theme_color, DEFAULT_THEME.primary)),
    secondary: sanitizeStr(raw?.secondary_color, DEFAULT_THEME.secondary),
    accent: sanitizeStr(raw?.accent_color, DEFAULT_THEME.accent),
    fonts: {
      title: sanitizeStr(raw?.title_font, DEFAULT_THEME.fonts.title),
      body: sanitizeStr(raw?.body_font, DEFAULT_THEME.fonts.body),
    },
  };

  const home = {
    sections: normalizeSections(raw?.home_sections),
    hero: {
      title: sanitizeStr(raw?.hero_title, DEFAULT_HOME.hero.title),
      subtitle: sanitizeStr(raw?.hero_subtitle, DEFAULT_HOME.hero.subtitle),
      logoUrl: sanitizeStr(raw?.hero_logo_url, DEFAULT_HOME.hero.logoUrl),
    },
    about: {
      md: sanitizeStr(raw?.about_md, DEFAULT_HOME.about.md),
    },
    teachers_intro: sanitizeStr(raw?.teachers_intro, ""),
    teachers_list: sanitizeStr(raw?.teachers_list, ""),
    blog_show: toBool(raw?.blog_show, DEFAULT_HOME.blog_show),
  };

  const branding = {
    academy_name: sanitizeStr(raw?.academy_name, DEFAULT_BRANDING.academy_name),
    principal_name: sanitizeStr(raw?.principal_name, DEFAULT_BRANDING.principal_name),
    academy_address: sanitizeStr(raw?.academy_address, DEFAULT_BRANDING.academy_address),
    academy_phone: sanitizeStr(raw?.academy_phone, DEFAULT_BRANDING.academy_phone),
    academy_email: sanitizeStr(raw?.academy_email, DEFAULT_BRANDING.academy_email),
    founded_year: sanitizeStr(raw?.founded_year, DEFAULT_BRANDING.founded_year),
    academy_description: sanitizeStr(raw?.academy_description, DEFAULT_BRANDING.academy_description),
  };

  return { menu, theme, home, branding };
};

const hydrateFromCache = (cached) => {
  if (!cached || typeof cached !== "object") {
    return DEFAULT_STATE;
  }
  const menu = { ...DEFAULT_MENU, ...(cached.menu || {}) };
  const theme = {
    ...DEFAULT_THEME,
    ...(cached.theme || {}),
    fonts: { ...DEFAULT_THEME.fonts, ...(cached.theme?.fonts || {}) },
  };
  const home = {
    ...DEFAULT_HOME,
    ...(cached.home || {}),
    sections: normalizeSections(cached.home?.sections || cached.home_sections),
    hero: { ...DEFAULT_HOME.hero, ...(cached.home?.hero || {}) },
    about: { ...DEFAULT_HOME.about, ...(cached.home?.about || {}) },
    blog_show: cached.home?.blog_show ?? DEFAULT_HOME.blog_show,
  };
  const branding = { ...DEFAULT_BRANDING, ...(cached.branding || {}) };
  return { ready: true, menu, theme, home, branding };
};

export function SiteSettingsProvider({ children }) {
  const cached = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const [state, setState] = useState(() => hydrateFromCache(cached));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/site/public-settings`);
        const data = await res.json();
        if (!alive || !res.ok) return;
        const mapped = mapSettingsToState(data?.settings || data || {});
        localStorage.setItem(KEY, JSON.stringify(mapped));
        setState({ ready: true, ...mapped });
        document.documentElement.style.setProperty("--theme-color", mapped.theme.color);
      } catch (error) {
        if (!state.ready) {
          setState((prev) => ({ ...prev, ready: true }));
        }
      }
    })();
    return () => {
      alive = false;
    };
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
