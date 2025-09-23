// client/src/components/Admin/CronSettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cfd8ea",
  outline: "none",
  background: "#fff",
};

const btn = {
  primary: { padding: "10px 14px", background: "#1677ff", color: "#fff", fontWeight: 700, border: 0, borderRadius: 10, cursor: "pointer" },
  success: { padding: "10px 14px", background: "#52c41a", color: "#fff", fontWeight: 700, border: 0, borderRadius: 10, cursor: "pointer" },
  ghost:   { padding: "10px 12px", background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer" }
};

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" }}>
      <div style={{ color: "#475569", fontWeight: 600 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// API 경로 폴백: /api/super → 404면 /api/admin으로 재시도
// ───────────────────────────────────────────────────────────
async function apiGetWithFallback(path, auth) {
  try {
    return await axios.get(`${API_URL}/api/super${path}`, auth);
  } catch (e) {
    if (e?.response?.status === 404) {
      return await axios.get(`${API_URL}/api/admin${path}`, auth);
    }
    throw e;
  }
}
async function apiPutWithFallback(path, data, auth) {
  try {
    return await axios.put(`${API_URL}/api/super${path}`, data, auth);
  } catch (e) {
    if (e?.response?.status === 404) {
      return await axios.put(`${API_URL}/api/admin${path}`, data, auth);
    }
    throw e;
  }
}
async function apiPostWithFallback(path, data, auth) {
  try {
    return await axios.post(`${API_URL}/api/super${path}`, data, auth);
  } catch (e) {
    if (e?.response?.status === 404) {
      return await axios.post(`${API_URL}/api/admin${path}`, data, auth);
    }
    throw e;
  }
}

export default function CronSettings() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const auth = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: token ? `Bearer ${token}` : undefined } };
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiGetWithFallback(`/cron-settings`, auth);
      setS(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "설정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const setField = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await apiPutWithFallback(`/cron-settings`, s, auth);
      setS(res.data);
      setMsg("저장되었습니다.");
    } catch (e) {
      setMsg(e?.response?.data?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const runNow = async (type, overrideNow) => {
    setMsg(null);
    try {
      const res = await apiPostWithFallback(`/cron/run-now`, { type, overrideNow }, auth);
      const out = res.data;
      if (out.skipped) {
        setMsg(`실행 스킵(${type}): ${out.reason}`);
      } else if (out.ok) {
        setMsg(`${type} 실행 완료: ${out.dryRun ? "드라이런" : "실행"} / processed=${out.processed ?? 0}`);
      } else {
        setMsg(`${type} 실행 오류: ${out.error || "unknown"}`);
      }
      fetchSettings();
    } catch (e) {
      setMsg(e?.response?.data?.message || "실행 실패");
    }
  };

  if (loading || !s) return <div style={{ padding: 12 }}>불러오는 중…</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px", marginBottom: 14,
        border: "1px solid #e7e9ef", borderRadius: 14,
        background: "linear-gradient(180deg, #f7faff 0%, #ffffff 100%)"
      }}>
        <div style={{ width: 10, height: 10, borderRadius: 9999, background: "#1677ff", boxShadow: "0 0 0 4px rgba(22,119,255,.12)" }} />
        <div>
          <div style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 800 }}>자동 작업(크론) 설정</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            DB 기반 설정으로 서버 재시작 없이 즉시 반영됩니다. 먼저 <b>드라이런</b>으로 검증한 뒤 운영 실행을 권장합니다.
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", color: "#075985", borderRadius: 10 }}>
          {msg}
        </div>
      )}

      {/* 자동하원 */}
      <div style={{ border: "1px solid #e8edf7", background: "#fff", borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 6, height: 18, borderRadius: 4, background: "#10b981" }} />
          <div style={{ fontWeight: 700, color: "#0f172a" }}>자동하원</div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <Field label="사용">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!s.autoLeaveEnabled} onChange={e => setField("autoLeaveEnabled", e.target.checked)} />
              <span>{s.autoLeaveEnabled ? "ON" : "OFF"}</span>
            </label>
          </Field>
          <Field label="CRON">
            <input value={s.autoLeaveCron || ""} onChange={e => setField("autoLeaveCron", e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="예: 0 23 * * * (매일 23:00)" />
          </Field>
          <Field label="최근 실행">
            <div>{s.lastAutoLeaveRunAt ? new Date(s.lastAutoLeaveRunAt).toLocaleString() : "-"}</div>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={save} disabled={saving} style={btn.primary}>저장</button>
          <button onClick={() => runNow("autoLeave")} style={btn.ghost}>지금 실행</button>
          <button onClick={() => {
            const iso = prompt("overrideNow(ISO, 예: 2025-09-23T23:05:00+09:00) 입력. 빈값=미사용", "");
            if (iso !== null) runNow("autoLeave", iso || undefined);
          }} style={btn.ghost}>
            시간 오버라이드 실행
          </button>
        </div>
      </div>

      {/* 일일 리포트 */}
      <div style={{ border: "1px solid #e8edf7", background: "#fff", borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 6, height: 18, borderRadius: 4, background: "#6366f1" }} />
          <div style={{ fontWeight: 700, color: "#0f172a" }}>일일 리포트</div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <Field label="사용">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!s.autoReportEnabled} onChange={e => setField("autoReportEnabled", e.target.checked)} />
              <span>{s.autoReportEnabled ? "ON" : "OFF"}</span>
            </label>
          </Field>
          <Field label="CRON">
            <input value={s.autoReportCron || ""} onChange={e => setField("autoReportCron", e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="예: 30 9 * * * (매일 09:30)" />
          </Field>
          <Field label="최근 실행">
            <div>{s.lastAutoReportRunAt ? new Date(s.lastAutoReportRunAt).toLocaleString() : "-"}</div>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={save} disabled={saving} style={btn.primary}>저장</button>
          <button onClick={() => runNow("dailyReport")} style={btn.ghost}>지금 실행</button>
          <button onClick={() => {
            const iso = prompt("overrideNow(ISO, 예: 2025-09-24T09:35:00+09:00) 입력. 빈값=미사용", "");
            if (iso !== null) runNow("dailyReport", iso || undefined);
          }} style={btn.ghost}>
            시간 오버라이드 실행
          </button>
        </div>
      </div>

      {/* 공통 옵션 */}
      <div style={{ border: "1px solid #e8edf7", background: "#fff", borderRadius: 14, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 6, height: 18, borderRadius: 4, background: "#94a3b8" }} />
          <div style={{ fontWeight: 700, color: "#0f172a" }}>공통 옵션</div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="드라이런(dryRun)">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!s.dryRun} onChange={e => setField("dryRun", e.target.checked)} />
              <span>{s.dryRun ? "ON" : "OFF"}</span>
            </label>
          </Field>
          <Field label="타임존">
            <input value={s.timezone || ""} onChange={e => setField("timezone", e.target.value)} style={{ ...inputStyle, width: 220 }} placeholder="Asia/Seoul" />
          </Field>
          <Field label="1회 처리 한도">
            <input value={s.rateLimitPerRun || 500} onChange={e => setField("rateLimitPerRun", Number(e.target.value || 0))} style={{ ...inputStyle, width: 120 }} type="number" min={1} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={save} disabled={saving} style={btn.primary}>저장</button>
          <button onClick={fetchSettings} style={btn.ghost}>새로고침</button>
        </div>
      </div>
    </div>
  );
}
