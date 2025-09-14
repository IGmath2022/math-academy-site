// client/src/pages/AdminDashboardTabs.jsx
import React, { useMemo, useState } from "react";
import "../styles/admin-skin.css";

// Admin 모듈들
import DailyReportAutoSwitch from "../components/Admin/DailyReportAutoSwitch";
import AutoLeaveSwitch from "../components/Admin/AutoLeaveSwitch";
import DailyReportEditor from "../components/Admin/DailyReportEditor";
import DailyReportSender from "../components/Admin/DailyReportSender";

import CounselManager from "../components/Admin/CounselManager";
import StudentProfilePanel from "../components/Admin/StudentProfilePanel";
import ClassTypeManager from "../components/Admin/ClassTypeManager";

import BlogSettingSwitch from "../components/Admin/BlogSettingSwitch";
import PopupBannerAdmin from "../components/Admin/PopupBannerAdmin";
import NewsAdmin from "../components/Admin/NewsAdmin";
import StudentManager from "../components/Admin/StudentManager";
import AttendanceManager from "../components/Admin/AttendanceManager";
import ProgressManager from "../components/Admin/ProgressManager";
import SchoolManager from "../components/Admin/SchoolManager";
import SchoolPeriodManager from "../components/Admin/SchoolPeriodManager";
import SubjectManager from "../components/Admin/SubjectManager";
import ChapterManager from "../components/Admin/ChapterManager";
import StudentAssignManager from "../components/Admin/StudentAssignManager";

// 선택 과목 상태는 과목/단원/할당에서 공유
function useSubjectState() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  return { selectedSubject, setSelectedSubject, chapterList, setChapterList };
}

/** 공통 패널 래퍼 */
function AdminPanel({ title, children }) {
  return (
    <section className="admin-panel">
      {title && <h3 className="admin-panel__title">{title}</h3>}
      {children}
    </section>
  );
}

export default function AdminDashboardTabs() {
  const [tab, setTab] = useState("report");
  const {
    selectedSubject,
    setSelectedSubject,
    chapterList,
    setChapterList,
  } = useSubjectState();

  const tabs = useMemo(
    () => [
      { key: "report",   label: "리포트" },
      { key: "consult",  label: "상담·프로필" },
      { key: "users",    label: "학생·출결·진도" },
      { key: "content",  label: "과목·단원·배정" },
      { key: "notice",   label: "공지·배너·뉴스" },
      { key: "school",   label: "학교·학사일정" },
    ],
    []
  );

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <h2 style={{ margin: 0, fontSize: 22 }}>운영자 대시보드</h2>
        <div className="admin-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "is-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-container">
        {/* 탭: 리포트 */}
        {tab === "report" && (
          <>
            <AdminPanel title="자동화 스위치">
              <div className="inline-row">
                <DailyReportAutoSwitch />
                <AutoLeaveSwitch />
              </div>
            </AdminPanel>

            <AdminPanel title="일일 리포트 작성/수정">
              <DailyReportEditor />
            </AdminPanel>

            <AdminPanel title="일일 리포트 발송">
              <DailyReportSender />
            </AdminPanel>
          </>
        )}

        {/* 탭: 상담/프로필 */}
        {tab === "consult" && (
          <>
            <AdminPanel title="상담 로그">
              <CounselManager />
            </AdminPanel>
            <AdminPanel title="학생 프로필 · 로드맵">
              <StudentProfilePanel />
            </AdminPanel>
            <AdminPanel title="수업형태 관리">
              <ClassTypeManager />
            </AdminPanel>
          </>
        )}

        {/* 탭: 학생/출결/진도 */}
        {tab === "users" && (
          <>
            <AdminPanel title="학생 관리">
              <StudentManager />
            </AdminPanel>
            <AdminPanel title="출결 관리">
              <AttendanceManager />
            </AdminPanel>
            <AdminPanel title="진도 관리">
              <ProgressManager />
            </AdminPanel>
          </>
        )}

        {/* 탭: 과목/단원/배정 */}
        {tab === "content" && (
          <>
            <AdminPanel title="과목 관리">
              <SubjectManager
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
              />
            </AdminPanel>

            {selectedSubject && (
              <AdminPanel title={`단원/강의 관리 — ${selectedSubject.name}`}>
                <ChapterManager
                  subject={selectedSubject}
                  onChapterListChange={setChapterList}
                />
                <div className="mt-14" />
                <StudentAssignManager chapterList={chapterList} />
              </AdminPanel>
            )}
          </>
        )}

        {/* 탭: 공지/배너/뉴스 */}
        {tab === "notice" && (
          <>
            <AdminPanel title="공지/뉴스">
              <NewsAdmin />
            </AdminPanel>
            <AdminPanel title="블로그 노출 설정">
              <BlogSettingSwitch />
            </AdminPanel>
            <AdminPanel title="팝업 배너">
              <PopupBannerAdmin />
            </AdminPanel>
          </>
        )}

        {/* 탭: 학교/학사일정 */}
        {tab === "school" && (
          <>
            <AdminPanel title="학교 관리">
              <SchoolManager />
            </AdminPanel>
            <AdminPanel title="학사 일정(기간) 관리">
              <SchoolPeriodManager />
            </AdminPanel>
          </>
        )}
      </div>
    </div>
  );
}
