// client/src/components/Admin/DailyReportAutoSwitch.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken, clearAuth } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

export default function DailyReportAutoSwitch() {
  const navigate = useNavigate();
  const [on, setOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate("/login");
      return true;
    }
    return false;
  };

  // 현재 값 조회
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/admin/settings/daily-auto`, withAuth());
        setOn(!!data?.on);
      } catch (e) {
        if (handle401(e)) return;
        // 무시
      }
    })();
    // eslint-disable-next-line
  }, []);

  const save = async (next) => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/api/admin/settings/daily-auto`, { on: next }, withAuth());
      setOn(next);
      setMsg(next ? "자동 발송: 켜짐" : "자동 발송: 꺼짐");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      if (handle401(e)) return;
      setMsg("저장 실패");
      setTimeout(() => setMsg(""), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ margin: "10px 0 18px", padding: 14, background: "#f7f9ff", borderRadius: 10, border: "1px solid #e5e8f2" }}>
      <b>데일리 리포트 자동 발송</b>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={on}
            disabled={saving}
            onChange={(e) => save(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          {on ? "켜짐" : "꺼짐"}
        </label>
        {msg && <span style={{ color: "#226ad6", fontWeight: 600 }}>{msg}</span>}
      </div>
      <div style={{ marginTop: 6, color: "#667" }}>
        * 예약 시간에 서버가 <code>/api/admin/lessons/send-bulk</code>를 실행할지 여부만 제어합니다. (수동 발송은 항상 가능)
      </div>
    </div>
  );
}
