// client/src/components/Staff/StaffTabs.jsx
import React, { useEffect, useState } from "react";
import StaffWorkloadCards from "./StaffWorkloadCards";
import StaffAlertsWidget from "./StaffAlertsWidget";
import StaffMonthView from "./StaffMonthView";
import StaffReportsTab from "./StaffReportsTab";
import StaffAttendanceTab from "./StaffAttendanceTab";
import StaffProgressTab from "./StaffProgressTab";
import StaffCalendarTab from "./StaffCalendarTab";
import StaffCounselTab from "./StaffCounselTab";

const STORAGE_KEY = "staff-active-tab";

const tabs = [
  {
    key: "today",
    label: "오늘",
    node: (
      <>
        <StaffWorkloadCards />
        <div style={{ height: 12 }} />
        <StaffAlertsWidget />
        <div style={{ height: 12 }} />
        <StaffMonthView />
      </>
    ),
  },
  { key: "reports", label: "리포트", node: <StaffReportsTab /> },
  { key: "attendance", label: "출결", node: <StaffAttendanceTab /> },
  { key: "progress", label: "진도", node: <StaffProgressTab /> },
  { key: "calendar", label: "반 캘린더", node: <StaffCalendarTab /> },
  { key: "counsel", label: "상담", node: <StaffCounselTab /> },
];

export default function StaffTabs() {
  // 마지막으로 본 탭을 기억(세션 단위)
  const [tab, setTab] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved || "today";
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, tab);
  }, [tab]);

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 4vw" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              background: tab === t.key ? "#226ad6" : "#e9eef7",
              color: tab === t.key ? "#fff" : "#234",
              fontWeight: 700,
            }}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.find((t) => t.key === tab)?.node}
    </div>
  );
}
