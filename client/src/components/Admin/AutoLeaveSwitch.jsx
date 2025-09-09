import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

export default function AutoLeaveSwitch() {
  const [on, setOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 현재 값 조회 (DB Setting: auto_leave_on)
  useEffect(() => {
    fetch(`${API_URL}/api/settings/auto_leave_on`)
      .then(res => res.json())
      .then(data => {
        // DB에 값이 없을 때는 true로 보이게(기본 ON)
        const v = (data?.value ?? "true") === "true";
        setOn(v);
      })
      .catch(() => {});
  }, []);

  const save = async (next) => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/api/settings`, {
        key: "auto_leave_on",
        value: next ? "true" : "false"
      });
      setOn(next);
      setMsg(next ? "자동하원: 켜짐" : "자동하원: 꺼짐");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg("저장 실패");
      setTimeout(() => setMsg(""), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ margin: "10px 0 18px", padding: 14, background: "#f7f9ff", borderRadius: 10, border: "1px solid #e5e8f2" }}>
      <b>자동하원(미체크 학생 22:30/23:00 일괄 처리)</b>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={on}
            disabled={saving}
            onChange={e => save(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          {on ? "켜짐" : "꺼짐"}
        </label>
        {msg && <span style={{ color: "#226ad6", fontWeight: 600 }}>{msg}</span>}
      </div>
      <div style={{ marginTop: 6, color: "#667", fontSize: 13 }}>
        * 서버 크론이 실행될 때 DB의 <code>auto_leave_on</code> 값이 "true"면 동작합니다.
      </div>
    </div>
  );
}
