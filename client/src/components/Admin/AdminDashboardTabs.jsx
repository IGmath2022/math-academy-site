// client/src/components/Admin/AdminDashboardTabs.jsx
import React, { useEffect, useMemo, useState } from "react";

// 공용 카드
import AdminCard from "./AdminCard";

// 리포트
import DailyReportAutoSwitch from "./DailyReportAutoSwitch";
import DailyReportEditor from "./DailyReportEditor";
import DailyReportSender from "./DailyReportSender";

// 상담/프로필/수업형태 (이미 새 카드톤으로 작성되어 있어 래핑 불필요)
import CounselManager from "./CounselManager";
import StudentProfilePanel from "./StudentProfilePanel";
import ClassTypeManager from "./ClassTypeManager";

// 출결/자동하원/진도 (일부 구형 톤 → 카드로 래핑)
import AttendanceManager from "./AttendanceManager";
import AutoLeaveSwitch from "./AutoLeaveSwitch";
import ProgressManager from "./ProgressManager";

// 학사/사이트 (구형 톤 → 카드로 래핑)
import SchoolManager from "./SchoolManager";
import SchoolPeriodManager from "./SchoolPeriodManager";
import BlogSettingSwitch from "./BlogSettingSwitch";
import PopupBannerAdmin from "./PopupBannerAdmin";
import NewsAdmin from "./NewsAdmin";
import StudentManager from "./StudentManager";

// 강의·단원·배정(내부에서 이미 카드/그룹화 했음)
import SubjectManager from "./SubjectManager";
import ChapterManager from "./ChapterManager";
import StudentAssignManager from "./StudentAssignManager";

/** ───────── 개별 탭 내용 ───────── */

function ReportsTab() {
  return (
    <div style={gridCol}>
      {/* 스위치는 작은 블록이라 카드로 감싸 통일 */}
      <AdminCard title="자동 발송 스위치">
        <DailyReportAutoSwitch />
      </AdminCard>

      {/* 에디터/발송은 이미 자체 카드 스타일 충분히 큼 */}
      <DailyReportEditor />
      <DailyReportSender />
    </div>
  );
}

function CounselProfileTab() {
  return (
    <div style={gridCol}>
      {/* 이미 최근 톤으로 카드화 되어 있음 */}
      <CounselManager />
      <StudentProfilePanel />
      <ClassTypeManager />
    </div>
  );
}

function AttendanceAutoTab() {
  return (
    <div style={gridCol}>
      <AdminCard title="출결 관리">
        <AttendanceManager />
      </AdminCard>
      <AdminCard title="자동 하원 스위치">
        <AutoLeaveSwitch />
      </AdminCard>
      {/* 진도는 별도 탭에서도 보이게 했지만 여기선 보조로 노출하고 싶다면 아래 유지/삭제 선택 */}
      {/* <AdminCard title="진도 관리(요약)">
        <ProgressManager />
      </AdminCard> */}
    </div>
  );
}

function ProgressTab() {
  return (
    <div style={gridCol}>
      {/* ProgressManager는 구형 스타일인 경우 카드로 감싸 통일 */}
      <AdminCard title="진도 관리">
        <ProgressManager />
      </AdminCard>
    </div>
  );
}

function SchoolTab() {
  return (
    <div style={gridCol}>
      <AdminCard title="학교 관리">
        <SchoolManager />
      </AdminCard>
      <AdminCard title="학사 일정(학기/기간)">
        <SchoolPeriodManager />
      </AdminCard>
    </div>
  );
}

function SiteTab() {
  return (
    <div style={gridCol}>
      <AdminCard title="블로그 노출 설정">
        <BlogSettingSwitch />
      </AdminCard>
      <AdminCard title="팝업 배너">
        <PopupBannerAdmin />
      </AdminCard>
      <AdminCard title="공지/뉴스 관리">
        <NewsAdmin />
      </AdminCard>
    </div>
  );
}

function StudentsTab() {
  return (
    <div style={gridCol}>
      <AdminCard title="학생 관리">
        <StudentManager />
      </AdminCard>
    </div>
  );
}

// 과목-단원-배정 탭은 내부 상태 공유 + 이미 카드 그룹화
function CurriculumTab() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AdminCard title="과목 선택">
        <SubjectManager
          onSelectSubject={setSelectedSubject}
          selectedSubject={selectedSubject}
        />
      </AdminCard>

      {selectedSubject && (
        <AdminCard
          title={
            <>
              단원/강의 관리:{" "}
              <span style={{ color: "#226ad6" }}>{selectedSubject.name}</span>
            </>
          }
        >
          <div style={{ display: "grid", gap: 14 }}>
            <ChapterManager
              subject={selectedSubject}
              onChapterListChange={setChapterList}
            />
            <StudentAssignManager chapterList={chapterList} />
          </div>
        </AdminCard>
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
      { key: "progress", label: "진도 관리", element: <ProgressTab /> },
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
        운영자 대시보드{" "}
        <span style={{ color: "#678", fontSize: 15 }}>(관리자용)</span>
      </h2>

      {/* 상단 탭 바 */}
      <div style={tabsBar}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              ...tabBtn,
              ...(active === t.key
                ? { background: "#226ad6", color: "#fff", borderColor: "#226ad6" }
                : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ marginTop: 16 }}>{TABS.find((t) => t.key === active)?.element}</div>
    </div>
  );
}

/** ───────── 공용 스타일 ───────── */
const gridCol = { display: "grid", gap: 16 };

const tabsBar = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  padding: 10,
  background: "#f7f9ff",
  border: "1px solid #e5e8f2",
  borderRadius: 12,
  boxShadow: "0 2px 14px #0001",
};

const tabBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #d6d9e4",
  background: "#fff",
  color: "#345",
  fontWeight: 800,
  cursor: "pointer",
};
