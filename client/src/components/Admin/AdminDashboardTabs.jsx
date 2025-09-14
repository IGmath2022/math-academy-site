// client/src/components/Admin/AdminDashboardTabs.jsx
import React, { useState } from "react";
import "../../styles/admin.css";

// 기존 모듈들 임포트
import DailyReportAutoSwitch from "./DailyReportAutoSwitch";
import AutoLeaveSwitch from "./AutoLeaveSwitch";
import DailyReportEditor from "./DailyReportEditor";
import DailyReportSender from "./DailyReportSender";

import CounselManager from "./CounselManager";
import StudentProfilePanel from "./StudentProfilePanel";
import ClassTypeManager from "./ClassTypeManager";

import BlogSettingSwitch from "./BlogSettingSwitch";
import PopupBannerAdmin from "./PopupBannerAdmin";
import NewsAdmin from "./NewsAdmin";
import StudentManager from "./StudentManager";
import AttendanceManager from "./AttendanceManager";
import ProgressManager from "./ProgressManager";
import SchoolManager from "./SchoolManager";
import SchoolPeriodManager from "./SchoolPeriodManager";
import SubjectManager from "./SubjectManager";
import ChapterManager from "./ChapterManager";
import StudentAssignManager from "./StudentAssignManager";

function AdminSection({ title, children }) {
  return (
    <section className="admin-card">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}

export default function AdminDashboardTabs() {
  const [active, setActive] = useState("report");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  const TabButton = ({ id, children }) => (
    <button
      className={`admin-tab ${active === id ? "active" : ""}`}
      onClick={() => setActive(id)}
    >
      {children}
    </button>
  );

  return (
    <div className="admin-shell">
      <div className="admin-tabs">
        <TabButton id="report">데일리 리포트</TabButton>
        <TabButton id="counsel">상담·프로필</TabButton>
        <TabButton id="content">콘텐츠·배너·뉴스</TabButton>
        <TabButton id="students">학생·출결·진도</TabButton>
        <TabButton id="curriculum">과목·단원·배정</TabButton>
      </div>

      {active === "report" && (
        <>
          <AdminSection title="자동화 스위치">
            {/* 이 두 컴포넌트 안의 폼 컨트롤/테이블도 admin.css 규칙으로 통일됨 */}
            <DailyReportAutoSwitch />
            <AutoLeaveSwitch />
          </AdminSection>

          <AdminSection title="리포트 작성/수정">
            <DailyReportEditor />
          </AdminSection>

          <AdminSection title="리포트 발송">
            <DailyReportSender />
          </AdminSection>
        </>
      )}

      {active === "counsel" && (
        <>
          <AdminSection title="상담 로그">
            <CounselManager />
          </AdminSection>
          <AdminSection title="학생 프로필 · 로드맵">
            <StudentProfilePanel />
          </AdminSection>
          <AdminSection title="수업형태 관리">
            <ClassTypeManager />
          </AdminSection>
        </>
      )}

      {active === "content" && (
        <>
          <AdminSection title="블로그 노출 설정">
            <BlogSettingSwitch />
          </AdminSection>
          <AdminSection title="팝업 배너 관리">
            <PopupBannerAdmin />
          </AdminSection>
          <AdminSection title="뉴스 관리">
            <NewsAdmin />
          </AdminSection>
        </>
      )}

      {active === "students" && (
        <>
          <AdminSection title="학생 관리">
            <StudentManager />
          </AdminSection>
          <AdminSection title="출결 관리">
            <AttendanceManager />
          </AdminSection>
          <AdminSection title="진도 관리">
            <ProgressManager />
          </AdminSection>
          <AdminSection title="학교 관리">
            <SchoolManager />
          </AdminSection>
          <AdminSection title="학사 일정(기간) 관리">
            <SchoolPeriodManager />
          </AdminSection>
        </>
      )}

      {active === "curriculum" && (
        <>
          <AdminSection title="과목 관리">
            <SubjectManager
              onSelectSubject={setSelectedSubject}
              selectedSubject={selectedSubject}
            />
          </AdminSection>

          {selectedSubject && (
            <AdminSection title={`단원/강의 · 배정 — ${selectedSubject.name}`}>
              <div className="admin-grid-2">
                <div>
                  <ChapterManager
                    subject={selectedSubject}
                    onChapterListChange={setChapterList}
                  />
                </div>
                <div>
                  <StudentAssignManager chapterList={chapterList} />
                </div>
              </div>
            </AdminSection>
          )}
        </>
      )}
    </div>
  );
}
