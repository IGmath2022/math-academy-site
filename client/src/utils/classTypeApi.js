// client/src/utils/classTypeApi.js
import { API_URL } from "../api";
import { getToken } from "./auth";

function headers() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
           : { "Content-Type": "application/json" };
}

/** 관리자: 전체 목록 */
export async function listClassTypes() {
  const r = await fetch(`${API_URL}/api/admin/class-types`, { headers: headers() });
  if (!r.ok) throw new Error("listClassTypes failed");
  return r.json();
}

/** 관리자: 생성 */
export async function createClassType(payload /* {name, active?, order?} */) {
  const r = await fetch(`${API_URL}/api/admin/class-types`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("createClassType failed");
  return r.json();
}

/** 관리자: 수정 */
export async function updateClassType(id, payload) {
  const r = await fetch(`${API_URL}/api/admin/class-types/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("updateClassType failed");
  return r.json();
}

/** 관리자: 삭제 (사용 중이면 409) */
export async function deleteClassType(id) {
  const r = await fetch(`${API_URL}/api/admin/class-types/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!r.ok) throw new Error("deleteClassType failed");
  return r.json();
}
