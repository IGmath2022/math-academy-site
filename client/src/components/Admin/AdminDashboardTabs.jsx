// client/src/components/Admin/AdminDashboardTabs.jsx
import React, { useState, useMemo } from "react";

// --- 리포트(일일 보고) ---
import DailyReportAutoSwitch from "./DailyReportAutoSwitch";
import AutoLeaveSwitch from "./AutoLeaveSwitch";
import DailyReportEditor from "./DailyReportEditor";
import DailyReportSender from "./DailyReportSender";

// --- 상담/프로필/수업형태 ---
import CounselManager from "./CounselManager";
import StudentProfilePanel from "./StudentProfilePanel";
import ClassTypeManager from "./ClassTypeManager";

// --- 출결/진도/과목/단원 ---
import AttendanceManager from "./AttendanceManager";
import ProgressManager from "./ProgressManager";
import SubjectManager from "./SubjectManager";
import ChapterManager from "./ChapterManager";
import StudentAssignManager from "./StudentAssignManager";

// --- 공지/홍보(블로그/배너/소식) ---
import BlogSettingSwitch from "./BlogSettingSwitch";
import PopupBannerAdmin from "./PopupBannerAdmin";
import NewsAdmin from "./NewsAdmin";

export default function AdminDashboardTabs() {
  const [active, setActive] = useState("report");

  // 과목/단원 탭에서 공유할 상태
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  const tabs = useMemo(
    () => [
      { key: "report", label: "일일 리포트" },
      { key: "counsel", label: "상담·프로필" },
      { key: "attendance", label: "출결 관리" },
      { key: "progress", label: "진도 관리" },
      { key: "subjects", label: "과목·단원" },
      { key: "promo", label: "공지·홍보" },
    ],
    []
  );

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "42px auto",
        padding: "0 16px 40px",
      }}
    >
      {/* 탭 바 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e2e7f2",
              background: active === t.key ? "#226ad6" : "#fff",
              color: active === t.key ? "#fff" : "#234",
              fontWeight: 800,
              boxShadow: active === t.key ? "0 2px 10px #0002" : "none",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 패널 */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8ecf4",
          borderRadius: 14,
          boxShadow: "0 6px 22px #0001",
          padding: 18,
        }}
      >
        {active === "report" && (
          <div>
            <h3 style={h3}>일일 리포트 · 자동화</h3>
            <div style={stack16}>
              <DailyReportAutoSwitch />
              <AutoLeaveSwitch />
            </div>

            <div style={{ height: 10 }} />

            <h3 style={h3}>리포트 작성/발송</h3>
            <div style={stack16}>
              <DailyReportEditor />
              <DailyReportSender />
            </div>
          </div>
        )}

        {active === "counsel" && (
          <div style={stack16}>
            <h3 style={h3}>상담·프로필 관리</h3>
            <CounselManager />
            <StudentProfilePanel />
            <ClassTypeManager />
          </div>
        )}

        {active === "attendance" && (
          <div style={stack16}>
            <h3 style={h3}>출결 관리</h3>
            <AttendanceManager />
          </div>
        )}

        {active === "progress" && (
          <div style={stack16}>
            <h3 style={h3}>진도 관리</h3>
            <ProgressManager />
          </div>
        )}

        {active === "subjects" && (
          <div>
            <h3 style={h3}>과목·단원 관리</h3>
            <div style={stack16}>
              <SubjectManager
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
              />

              {selectedSubject && (
                <div
                  style={{
                    border: "1px solid #e8ecf4",
                    background: "#f9fbff",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      marginBottom: 10,
                      color: "#223",
                    }}
                  >
                    선택 과목:{" "}
                    <span style={{ color: "#226ad6" }}>
                      {selectedSubject.name}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                      gap: 16,
                    }}
                  >
                    <ChapterManager
                      subject={selectedSubject}
                      onChapterListChange={setChapterList}
                    />
                    <StudentAssignManager chapterList={chapterList} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "promo" && (
          <div>
            <h3 style={h3}>공지·홍보</h3>

            {/* 1) 블로그 노출 설정 — 상단 단일 행 전체폭 */}
            <div
              style={{
                border: "1px solid #e8ecf4",
                background: "#f9fbff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <BlogSettingSwitch />
            </div>

            {/* 2) 아래 2열: 배너 / 소식 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                gap: 16,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  border: "1px solid #e8ecf4",
                  background: "#fff",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <PopupBannerAdmin />
              </div>
              <div
                style={{
                  border: "1px solid #e8ecf4",
                  background: "#fff",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <NewsAdmin />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 공용 작은 스타일 ---------- */
const h3 = {
  margin: "4px 0 12px",
  fontSize: 18,
  fontWeight: 900,
  color: "#1f2a3a",
};
const stack16 = { display: "grid", gap: 16 };
