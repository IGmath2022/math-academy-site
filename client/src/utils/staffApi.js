// client/src/utils/staffApi.js
import { API_URL } from "../api";
import { getToken } from "./auth";

function authHeaders() {
  const t = getToken();
  return t
    ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/* =========================
 * 위젯/월간 뷰 관련
 * ========================= */
export async function fetchTodayAlerts() {
  const r = await fetch(`${API_URL}/api/staff/alerts/today`, { headers: authHeaders() });
  if (!r.ok) throw new Error("alerts fetch failed");
  return r.json();
}

export async function fetchMonthLogs(month /* 'YYYY-MM' */) {
  const url = new URL(`${API_URL}/api/staff/lessons/month-logs`);
  if (month) url.searchParams.set("month", month);
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error("month logs fetch failed");
  return r.json();
}

/* =========================
 * 자동 발송 스위치
 * ========================= */
export async function getDailyAuto() {
  const r = await fetch(`${API_URL}/api/staff/settings/daily-auto`, { headers: authHeaders() });
  if (!r.ok) throw new Error("get daily auto failed");
  return r.json();
}

export async function setDailyAuto(on) {
  const r = await fetch(`${API_URL}/api/staff/settings/daily-auto`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ on }),
  });
  if (!r.ok) throw new Error("set daily auto failed");
  return r.json();
}

/* =========================
 * 사이트 전역 설정(슈퍼용)
 * ========================= */
export async function getSiteSettings() {
  const r = await fetch(`${API_URL}/api/admin/super/site-settings`, { headers: authHeaders() });
  if (!r.ok) throw new Error("get site settings failed");
  return r.json();
}

export async function saveSiteSettings(payload) {
  const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("save site settings failed");
  return r.json();
}

/* =========================
 * 레슨(리포트)
 * ========================= */
export async function listLessonsByDate({ date, scope = "present" }) {
  const url = new URL(`${API_URL}/api/staff/lessons/by-date`);
  if (date) url.searchParams.set("date", date);
  if (scope) url.searchParams.set("scope", scope);
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error("list lessons failed");
  return r.json();
}

export async function getLessonDetail({ studentId, date }) {
  const url = new URL(`${API_URL}/api/staff/lessons/detail`);
  url.searchParams.set("studentId", studentId);
  url.searchParams.set("date", date);
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error("get detail failed");
  return r.json();
}

export async function upsertLesson(payload) {
  const r = await fetch(`${API_URL}/api/staff/lessons/upsert`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("upsert failed");
  return r.json();
}

export async function sendSelected(ids = []) {
  const r = await fetch(`${API_URL}/api/staff/lessons/send-selected`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ids }),
  });
  if (!r.ok) throw new Error("send selected failed");
  return r.json();
}

/* =========================
 * 출결 수동
 * ========================= */
export async function getAttendanceOne({ studentId, date }) {
  const url = new URL(`${API_URL}/api/staff/attendance/one`);
  url.searchParams.set("studentId", studentId);
  url.searchParams.set("date", date);
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error("attendance one failed");
  return r.json();
}

export async function setAttendanceTimes({ studentId, date, checkIn, checkOut, overwrite = true }) {
  const r = await fetch(`${API_URL}/api/staff/attendance/set-times`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ studentId, date, checkIn, checkOut, overwrite }),
  });
  if (!r.ok) throw new Error("attendance set failed");
  return r.json();
}

/* =========================
 * 워크로드(담당 반/학생 수)
 * ========================= */
export async function fetchWorkload() {
  const r = await fetch(`${API_URL}/api/staff/metrics/workload`, { headers: authHeaders() });
  if (!r.ok) throw new Error("workload failed");
  return r.json();
}

/* =========================
 * 상담(CounselLog 기반)
 * ========================= */
export async function listCounsel(month /* YYYY-MM */) {
  const url = new URL(`${API_URL}/api/staff/counsel`);
  if (month) url.searchParams.set("month", month);
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error("counsel list failed");
  return r.json();
}

export async function upsertCounsel(payload /* {id?, date, studentId, memo, publicOn} */) {
  const r = await fetch(`${API_URL}/api/staff/counsel/upsert`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("counsel upsert failed");
  return r.json();
}

export async function deleteCounsel(id) {
  const r = await fetch(`${API_URL}/api/staff/counsel/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error("counsel delete failed");
  return r.json();
}
