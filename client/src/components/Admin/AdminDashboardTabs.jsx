import React, { useEffect, useMemo, useState } from "react";

// 리포트
import DailyReportAutoSwitch from "./DailyReportAutoSwitch";
import DailyReportEditor from "./DailyReportEditor";
import DailyReportSender from "./DailyReportSender";

// 상담/프로필/수업형태
import CounselManager from "./CounselManager";
import StudentProfilePanel from "./StudentProfilePanel";
import ClassTypeManager from "./ClassTypeManager";

// 출결/자동하원/진도
import AttendanceManager from "./AttendanceManager";
import AutoLeaveSwitch from "./AutoLeaveSwitch";
import ProgressManager from "./ProgressManager";

// 학사/사이트
import SchoolManager from "./SchoolManager";
import SchoolPeriodManager from "./SchoolPeriodManager";
import BlogSettingSwitch from "./BlogSettingSwitch";
import PopupBannerAdmin from "./PopupBannerAdmin";
import NewsAdmin from "./NewsAdmin";
import StudentManager from "./StudentManager";

// 강의·단원·배정(상태 공유 필요)
import SubjectManager from "./SubjectManager";
import ChapterManager from "./ChapterManager";
import StudentAssignManager from "./StudentAssignManager";

/** ───────── 개별 탭 내용 ───────── */

function ReportsTab() {
  return (
    <div style={gridCol}>
      <DailyReportAutoSwitch />
      <DailyReportEditor />
      <DailyReportSender />
    </div>
  );
}

function CounselProfileTab() {
  return (
    <div style={gridCol}>
      <CounselManager />
      <StudentProfilePanel />
      <ClassTypeManager />
    </div>
  );
}

function AttendanceAutoTab() {
  return (
    <div style={gridCol}>
      <AttendanceManager />
      <AutoLeaveSwitch />
    </div>
  );
}

function SchoolTab() {
  return (
    <div style={gridCol}>
      <SchoolManager />
      <SchoolPeriodManager />
    </div>
  );
}

function SiteTab() {
  return (
    <div style={gridCol}>
      <BlogSettingSwitch />
      <PopupBannerAdmin />
      <NewsAdmin />
    </div>
  );
}

function StudentsTab() {
  return (
    <div style={gridCol}>
      <StudentManager />
    </div>
  );
}

// 과목-단원-배정 탭은 내부 상태 공유
function CurriculumTab() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SubjectManager
        onSelectSubject={setSelectedSubject}
        selectedSubject={selectedSubject}
      />
      {selectedSubject && (
        <div
          style={{
            marginTop: 6,
            padding: 14,
            borderRadius: 10,
            background: "#f7f8fa",
            border: "1px solid #e5e5e5",
          }}
        >
          <h3 style={{ fontSize: 18, marginBottom: 10 }}>
            단원/강의 관리:{" "}
            <span style={{ color: "#226ad6" }}>{selectedSubject.name}</span>
          </h3>
          <ChapterManager
            subject={selectedSubject}
            onChapterListChange={setChapterList}
          />
          <StudentAssignManager chapterList={chapterList} />
        </div>
      )}
    </div>
  );
}

/** ───────── 탭 컨테이너 ───────── */

export default function AdminDashboardTabs() {
  // URL hash 로 초기 탭 기억/복원 (#tab=reports 등)
  const initialFromHash = (() => {
    const m = String(window.location.hash || "").match(/tab=([\w-]+)/);
    return m?.[1] || "reports";
  })();

  const [active, setActive] = useState(initialFromHash);

  // 탭 변경 시 해시 업데이트
  useEffect(() => {
    if (!active) return;
    const base = window.location.href.split("#")[0];
    window.history.replaceState(null, "", `${base}#tab=${active}`);
  }, [active]);

  const TABS = useMemo(
    () => [
      { key: "reports", label: "리포트", element: <ReportsTab /> },
      { key: "counsel", label: "상담·프로필", element: <CounselProfileTab /> },
      { key: "attn", label: "출결·자동하원", element: <AttendanceAutoTab /> },
      { key: "progress", label: "진도 관리", element: <ProgressManager /> },
      { key: "curr", label: "강의·단원·배정", element: <CurriculumTab /> },
      { key: "school", label: "학사(학교/일정)", element: <SchoolTab /> },
      { key: "site", label: "사이트·홍보", element: <SiteTab /> },
      { key: "students", label: "학생 관리", element: <StudentsTab /> },
    ],
    []
  );

  return (
    <div style={{ maxWidth: 1080, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ textAlign: "center", margin: "0 0 18px 0", fontSize: 22 }}>
        운영자 대시보드 <span style={{ color: "#678", fontSize: 15 }}>(관리자용)</span>
      </h2>

      {/* 상단 탭 바 */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          padding: 10,
          background: "#f7f9ff",
          border: "1px solid #e5e8f2",
          borderRadius: 12,
          boxShadow: "0 2px 14px #0001",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #d6d9e4",
              background: active === t.key ? "#226ad6" : "#fff",
              color: active === t.key ? "#fff" : "#345",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ marginTop: 16 }}>
        {TABS.find((t) => t.key === active)?.element}
      </div>
    </div>
  );
}

/** ───────── 공용 스타일 ───────── */
const gridCol = { display: "grid", gap: 16 };
