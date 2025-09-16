// client/src/utils/superApi.js
import { API_URL } from "../api";
import { getToken } from "./auth";

function authHeaders() {
  const t = getToken();
  return t
    ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/** 슈퍼 전역 설정 조회 */
export async function getSiteSettings() {
  const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error("getSiteSettings failed");
  return r.json(); // { ok: true, settings: {...} }
}

/** 슈퍼 전역 설정 저장
 * body 스펙은 서버 superSettingsController.js 의 saveSiteSettings와 동일:
 * {
 *   menu_home_on, menu_blog_on, menu_materials_on, menu_contact_on,
 *   site_theme_color, site_theme_mode,
 *   home_sections: [{key,on}], default_class_name
 * }
 */
export async function saveSiteSettings(payload) {
  const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("saveSiteSettings failed");
  return r.json(); // { ok: true }
}
