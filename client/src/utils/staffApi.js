// client/src/utils/staffApi.js
import axios from "axios";
import { API_URL } from "../api";
import { getToken } from "./auth";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ====== 강사 대시보드 공용 ====== */

// 오늘 알림 (미출결 / 전날 미작성)
export async function fetchTodayAlerts() {
  const { data } = await axios.get(`${API_URL}/api/staff/alerts/today`, {
    headers: authHeaders(),
  });
  return data || {};
}

// 날짜별 레슨 목록
export async function listLessonsByDate({ date, scope = "present" }) {
  const { data } = await axios.get(`${API_URL}/api/staff/lessons`, {
    params: { date, scope },
    headers: authHeaders(),
  });
  return data || { items: [] };
}

// 리포트 상세
export async function getLessonDetail({ studentId, date }) {
  const { data } = await axios.get(`${API_URL}/api/staff/lessons/detail`, {
    params: { studentId, date },
    headers: authHeaders(),
  });
  return data || {};
}

// 리포트 업서트
export async function upsertLesson(payload) {
  const { data } = await axios.post(`${API_URL}/api/staff/lessons`, payload, {
    headers: authHeaders(),
  });
  return data || {};
}

// 예약 대기
export async function listPending() {
  const { data } = await axios.get(`${API_URL}/api/staff/lessons/pending`, {
    headers: authHeaders(),
  });
  return data || [];
}

// 선택 발송
export async function sendSelected(ids) {
  const { data } = await axios.post(
    `${API_URL}/api/staff/lessons/send-selected`,
    { ids },
    { headers: authHeaders() }
  );
  return data || {};
}

// 출결 1건 조회
export async function getAttendanceOne({ studentId, date }) {
  const { data } = await axios.get(`${API_URL}/api/staff/attendance/one`, {
    params: { studentId, date },
    headers: authHeaders(),
  });
  return data || {};
}

// 출결 퀵 저장
export async function setAttendanceTimes({ studentId, date, checkIn, checkOut, overwrite = true }) {
  const { data } = await axios.post(
    `${API_URL}/api/staff/attendance/set-times`,
    { studentId, date, checkIn, checkOut, overwrite },
    { headers: authHeaders() }
  );
  return data || {};
}

// 월 로그 요약
export async function fetchMonthLogs(month /* 'YYYY-MM' */) {
  const { data } = await axios.get(`${API_URL}/api/staff/lessons/month-logs`, {
    params: { month },
    headers: authHeaders(),
  });
  return data || { month, items: [] };
}

// 워크로드 메트릭
export async function fetchWorkloadMetrics() {
  const { data } = await axios.get(`${API_URL}/api/staff/metrics/workload`, {
    headers: authHeaders(),
  });
  return data || { classes: 0, students: 0 };
}

/* ====== 상담 탭 ====== */

// 상담 목록 (월별) → 항상 배열만 반환
export async function fetchCounselByMonth(month /* 'YYYY-MM' */) {
  const { data } = await axios.get(`${API_URL}/api/staff/counsel`, {
    params: { month },
    headers: authHeaders(),
  });
  // 서버는 { ok, month, items:[...] } 형식 → 안전하게 배열로만 리턴
  const items = Array.isArray(data?.items) ? data.items : [];
  return items;
}

// 상담 업서트
export async function upsertCounsel({ studentId, date, memo, publicOn }) {
  const { data } = await axios.post(
    `${API_URL}/api/staff/counsel`,
    { studentId, date, memo, publicOn },
    { headers: authHeaders() }
  );
  return data || {};
}

// 상담 삭제
export async function deleteCounsel(id) {
  const { data } = await axios.delete(`${API_URL}/api/staff/counsel/${id}`, {
    headers: authHeaders(),
  });
  return data || {};
}
