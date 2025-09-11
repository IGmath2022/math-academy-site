import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

export default function DailyReportAutoSwitch() {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 관리자 인증 헤더
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // 현재 값 조회 (/api/admin/settings/daily-auto)
  const fetchState = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/settings/daily-auto`, auth);
      setOn(!!data?.on);
      setMsg("");
    } catch {
      setMsg("자동 발송 상태 조회 실패");
      setTimeout(() => setMsg(""), 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 저장 (/api/admin/settings/daily-auto)
  const save = async (next) => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/api/admin/settings/daily-auto`, { on: next }, auth);
      setOn(next);
      setMsg(next ? "자동 발송: 켜짐" : "자동 발송: 꺼짐");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg("저장 실패");
      setTimeout(() => setMsg(""), 1500);
    } finally {
      setSaving(false);
    }
  };

  // 지금 자동발송 실행 (토글이 켜져있을 때만)
  const runNow = async () => {
    if (!on) {
      setMsg("자동 발송이 꺼져 있습니다.");
      setTimeout(() => setMsg(""), 1200);
      return;
    }
    try {
      const { data } = await axios.post(`${API_URL}/api/admin/lessons/send-bulk`, {}, auth);
      const sent = data?.sent ?? 0;
      const failed = data?.failed ?? 0;
      const message = data?.message ? ` (${data.message})` : "";
      setMsg(`자동발송 실행: sent=${sent}, failed=${failed}${message}`);
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("자동발송 실행 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  return (
    <div style={{ margin: "10px 0 18px", padding: 14, background: "#f7f9ff", borderRadius: 10, border: "1px solid #e5e8f2" }}>
      <b>데일리 리포트 자동 발송</b>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={on}
            disabled={saving || loading}
            onChange={e => save(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          {on ? "켜짐" : "꺼짐"}
        </label>
        <button
          onClick={runNow}
          disabled={loading}
          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccd3e0", background: "#f8fafc" }}
        >
          지금 자동발송 실행
        </button>
        {loading && <span style={{ color: "#888" }}>상태 불러오는 중…</span>}
        {msg && <span style={{ color: "#226ad6", fontWeight: 600 }}>{msg}</span>}
      </div>
      <div style={{ marginTop: 6, color: "#667" }}>
        * 예약 시간에 서버가 <code>/api/admin/lessons/send-bulk</code>를 실행할지 여부를 제어합니다. (수동 발송은 항상 가능)
      </div>
    </div>
  );
}
