// client/src/utils/sitePublic.js
import { API_URL } from "../api";

export function applyTheme({ site_theme_color, site_theme_mode } = {}) {
  try {
    const root = document.documentElement;
    if (site_theme_color) root.style.setProperty("--theme-color", site_theme_color);
    root.setAttribute("data-theme", site_theme_mode === "dark" ? "dark" : "light");
  } catch {}
}

export async function fetchPublicSiteSettings() {
  try {
    const r = await fetch(`${API_URL}/api/site/public-settings`);
    if (!r.ok) throw new Error("bad response");
    const j = await r.json();
    return j; // { ok:true, settings:{...} }
  } catch {
    // 실패해도 기본값
    return {
      ok: true,
      settings: {
        menu_home_on: true,
        menu_blog_on: true,
        menu_materials_on: true,
        menu_contact_on: true,
        site_theme_color: "#2d4373",
        site_theme_mode: "light",
        default_class_name: "IG수학",
        home_sections: [],
      },
    };
  }
}

export function emitSiteSettingsUpdated() {
  try { window.dispatchEvent(new Event("site-settings-updated")); } catch {}
}
