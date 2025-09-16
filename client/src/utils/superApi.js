// client/src/utils/superApi.js
import { API_URL } from "../api";
import { getToken } from "./auth";

export async function getSiteSettings() {
  const token = getToken();
  const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error('getSiteSettings failed');
  return await r.json(); // { ok:true, settings:{...} }
}

export async function saveSiteSettings(payload) {
  const token = getToken();
  const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('saveSiteSettings failed');
  return await r.json(); // { ok:true }
}
