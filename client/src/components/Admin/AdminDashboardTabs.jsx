// client/src/components/Admin/AdminDashboardTabs.jsx
import React, { useState, useMemo } from "react";
import "../../styles/admin-skin.css";

// === Admin modules ===
import DailyReportAutoSwitch from "./DailyReportAutoSwitch";
import AutoLeaveSwitch from "./AutoLeaveSwitch";
import DailyReportEditor from "./DailyReportEditor";
import DailyReportSender from "./DailyReportSender";

import CounselManager from "./CounselManager";
import StudentProfilePanel from "./StudentProfilePanel";
import ClassTypeManager from "./ClassTypeManager";

import AttendanceManager from "./AttendanceManager";
import StudentManager from "./StudentManager";
import SchoolManager from "./SchoolManager";
import SchoolPeriodManager from "./SchoolPeriodManager";

import ProgressManager from "./ProgressManager";

import SubjectManager from "./SubjectManager";
import ChapterManager from "./ChapterManager";
import StudentAssignManager from "./StudentAssignManager";

import BlogSettingSwitch from "./BlogSettingSwitch";
import PopupBannerAdmin from "./PopupBannerAdmin";
import NewsAdmin from "./NewsAdmin";

/** 공용 카드 */
function AdminCard({ title, subtitle, children }) {
  return (
    <section className="admin-card">
      <div className="admin-card__hd">
        <div className="admin-card__title">{title}</div>
        {subtitle ? <div className="admin-card__sub">{subtitle}</div> : null}
      </div>
      <div className="admin-card__bd">{children}</div>
    </section>
  );
}

/** 공용 그리드 */
function AdminGrid({ children, cols = 2 }) {
  const cls = `admin-grid admin-grid--cols-${cols}`;
  return <div className={cls}>{children}</div>;
}

/** 탭 헤더 */
function Tabs({ items, active, onChange }) {
  return (
    <div className="admin-tabs" role="tablist" aria-label="관리자 탭">
      {items.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={`admin-tab ${active === t.key ? "is-active" : ""}`}
          onClick={() => onChange(t.key)}
          title={t.label}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** 레거시 컴포넌트 정리 래퍼
 * 내부에 있는 input/select/textarea/button/table 크기/간격을
 * admin-skin.css가 강제 정리할 수 있도록 스코프를 부여합니다.
 */
function LegacyPanel({ children }) {
  return <div className="legacy-panel">{children}</div>;
}

export default function AdminDashboardTabs() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  const [active, setActive] = useState("report-write");

  const tabs = useMemo(
    () => [
      { key: "automation", label: "자동화" },
      { key: "report-write", label: "리포트 작성" },
      { key: "report-send", label: "리포트 발송" },
      { key: "counsel-profile", label: "상담·프로필" },
      { key: "class-types", label: "수업형태" },
      { key: "attendance", label: "출결" },
      { key: "students-schools", label: "학생/학교" },
      { key: "progress", label: "진도관리" },
      { key: "content", label: "콘텐츠(과목/단원/배정)" },
      { key: "marketing", label: "블로그·배너·소식" },
    ],
    []
  );

  return (
    <div className="admin-skin">
      <div className="admin-wrap">
        <h2 className="admin-page-title">
          운영자 대시보드 <span className="muted">(관리자용)</span>
        </h2>

        <Tabs items={tabs} active={active} onChange={setActive} />

        <div className="admin-content">
          {active === "automation" && (
            <AdminGrid cols={2}>
              <AdminCard
                title="데일리 리포트 자동 발송"
                subtitle="설정값(daily_report_auto_on)에 따라 서버 크론이 예약분을 처리합니다."
              >
                <LegacyPanel>
                  <DailyReportAutoSwitch />
                </LegacyPanel>
              </AdminCard>

              <AdminCard
                title="자동 하원 처리"
                subtitle="야간 자동하원 스케줄 (auto_leave_on)"
              >
                <LegacyPanel>
                  <AutoLeaveSwitch />
                </LegacyPanel>
              </AdminCard>
            </AdminGrid>
          )}

          {active === "report-write" && (
            <AdminCard
              title="데일리 리포트 작성/수정"
              subtitle="학생별로 작성하고 예약(기본 내일 10:30)으로 저장됩니다."
            >
              <LegacyPanel>
                <DailyReportEditor />
              </LegacyPanel>
            </AdminCard>
          )}

          {active === "report-send" && (
            <AdminCard
              title="데일리 리포트 발송"
              subtitle="작성된 내역을 선택 발송하거나 단건 발송할 수 있습니다."
            >
              <LegacyPanel>
                <DailyReportSender />
              </LegacyPanel>
            </AdminCard>
          )}

          {active === "counsel-profile" && (
            <AdminGrid cols={2}>
              <AdminCard
                title="상담 로그"
                subtitle="학생 상담 메모를 기록/수정/공개 설정합니다."
              >
                <LegacyPanel>
                  <CounselManager />
                </LegacyPanel>
              </AdminCard>
              <AdminCard
                title="학생 프로필 · 로드맵"
                subtitle="공개 설정 시 리포트 뷰 하단에 노출됩니다."
              >
                <LegacyPanel>
                  <StudentProfilePanel />
                </LegacyPanel>
              </AdminCard>
            </AdminGrid>
          )}

          {active === "class-types" && (
            <AdminCard
              title="수업형태 관리"
              subtitle="리포트 작성 시 사용할 수업형태 옵션을 관리합니다."
            >
              <LegacyPanel>
                <ClassTypeManager />
              </LegacyPanel>
            </AdminCard>
          )}

          {active === "attendance" && (
            <AdminCard
              title="출결 관리"
              subtitle="리스트/수정/자동하원 처리 상태를 확인하세요."
            >
              <LegacyPanel>
                <AttendanceManager />
              </LegacyPanel>
            </AdminCard>
          )}

          {active === "students-schools" && (
            <AdminGrid cols={2}>
              <AdminCard title="학생 관리">
                <LegacyPanel>
                  <StudentManager />
                </LegacyPanel>
              </AdminCard>
              <AdminCard title="학교/학사일정">
                <LegacyPanel>
                  <SchoolManager />
                </LegacyPanel>
                <div style={{ height: 16 }} />
                <LegacyPanel>
                  <SchoolPeriodManager />
                </LegacyPanel>
              </AdminCard>
            </AdminGrid>
          )}

          {active === "progress" && (
            <AdminCard
              title="진도 관리"
              subtitle="학생 진도 현황을 확인하고 관리합니다."
            >
              <LegacyPanel>
                <ProgressManager />
              </LegacyPanel>
            </AdminCard>
          )}

          {active === "content" && (
            <>
              <AdminCard title="과목 관리">
                <LegacyPanel>
                  <SubjectManager
                    onSelectSubject={setSelectedSubject}
                    selectedSubject={selectedSubject}
                  />
                </LegacyPanel>
              </AdminCard>

              {selectedSubject && (
                <AdminGrid cols={1}>
                  <AdminCard
                    title={`단원/강의 관리 — ${selectedSubject.name}`}
                    subtitle="단원(챕터)을 관리한 뒤 학생에게 강의를 배정하세요."
                  >
                    <LegacyPanel>
                      <ChapterManager
                        subject={selectedSubject}
                        onChapterListChange={setChapterList}
                      />
                    </LegacyPanel>
                    <div style={{ height: 14 }} />
                    <LegacyPanel>
                      <StudentAssignManager chapterList={chapterList} />
                    </LegacyPanel>
                  </AdminCard>
                </AdminGrid>
              )}
            </>
          )}

          {active === "marketing" && (
            <AdminGrid cols={2}>
              <AdminCard title="블로그 노출 설정">
                <LegacyPanel>
                  <BlogSettingSwitch />
                </LegacyPanel>
              </AdminCard>
              <AdminCard title="팝업/배너 관리">
                <LegacyPanel>
                  <PopupBannerAdmin />
                </LegacyPanel>
              </AdminCard>
              <AdminCard title="소식/공지 관리">
                <LegacyPanel>
                  <NewsAdmin />
                </LegacyPanel>
              </AdminCard>
            </AdminGrid>
          )}
        </div>
      </div>
    </div>
  );
}
