// client/src/components/Staff/StaffAlertsWidget.jsx
import React, { useEffect, useState } from "react";
import { fetchTodayAlerts } from "../../utils/staffApi";

export default function StaffAlertsWidget() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchTodayAlerts();
        setData(r || {});
      } catch (e) {
        setErr("오늘 알림을 불러오지 못했습니다.");
      }
    })();
  }, []);

  if (err) return <Panel><ErrorLine>{err}</ErrorLine></Panel>;
  if (!data) return <Panel><Muted>불러오는 중…</Muted></Panel>;

  const missingAttendanceArr =
    Array.isArray(data.missingAttendance)
      ? data.missingAttendance
      : Array.isArray(data.missingAttendance?.names)
        ? data.missingAttendance.names
        : [];

  const prev = data.missingReportPrev || {};
  const prevNames =
    Array.isArray(prev)
      ? prev
      : Array.isArray(prev.names)
        ? prev.names
        : [];
  const prevDate = prev.date || "-";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <AlertCard title="오늘 미출결" items={missingAttendanceArr} />
      <AlertCard title={`이전 수업(${prevDate}) 미작성 리포트`} items={prevNames} />
    </div>
  );
}

function AlertCard({ title, items }) {
  return (
    <Panel>
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: "36px" }}>{items.length}</div>
      {items.length > 0 && (
        <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
          {items.slice(0, 6).join(", ")}{items.length > 6 ? " 외" : ""}
        </div>
      )}
    </Panel>
  );
}

const Panel = ({ children }) => (
  <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12, background: "#fff" }}>
    {children}
  </div>
);
const Muted = ({ children }) => <div style={{ color: "#888", textAlign: "center" }}>{children}</div>;
const ErrorLine = ({ children }) => <div style={{ color: "#c11", margin: "6px 0" }}>{children}</div>;
