// client/src/components/Admin/AdminDashboardTabs.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";

// ── 리포트(일일 보고)
import DailyReportAutoSwitch from "./DailyReportAutoSwitch";
import AutoLeaveSwitch from "./AutoLeaveSwitch";
import DailyReportEditor from "./DailyReportEditor";
import DailyReportSender from "./DailyReportSender";

// ── 상담/프로필/수업형태
import CounselManager from "./CounselManager";
import StudentProfilePanel from "./StudentProfilePanel";
import ClassTypeManager from "./ClassTypeManager";

// ── 출결/진도/과목/단원
import AttendanceManager from "./AttendanceManager";
import ProgressManager from "./ProgressManager";
import SubjectManager from "./SubjectManager";
import ChapterManager from "./ChapterManager";
import StudentAssignManager from "./StudentAssignManager";

// ── 홍보/공지/배너 (기존 파일 재사용)
import BlogSettingSwitch from "./BlogSettingSwitch";
import AdminNoticeManager from "./AdminNoticeManager";
import PopupBannerAdmin from "./PopupBannerAdmin";

// ── 학교/학생 (기존 파일 재사용)
import SchoolManager from "./SchoolManager";
import SchoolPeriodManager from "./SchoolPeriodManager";
import StudentManager from "./StudentManager";

/**
 * 스타일 가이드(이 파일 내부에서만 적용):
 * - 배경: 은은한 그라데이션 + 중앙 컨테이너 카드 느낌
 * - TabBar: 상단 고정(sticky), 호버/포커스/활성 스타일 일관화
 * - SectionCard: 기존 컴포넌트를 감싸는 공통 카드. 제목/설명/액션영역 지원
 * - Responsive: auto-fit 그리드, 모바일에서도 간격 유지
 *
 * 기존 컴포넌트 파일은 건드리지 않고 여기에서만 “보는 맛”을 정리
 */

// CSS 변수 주입 (이 파일에서 한 번만)
function useInjectOnceStyle() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const style = document.createElement("style");
    style.innerHTML = `
      :root{
        --adm-bg: #f6f8fb;
        --adm-card-bg: #fff;
        --adm-border: #e8edf3;
        --adm-radius: 14px;
        --adm-shadow: 0 6px 20px rgba(25, 35, 60, 0.06);
        --adm-primary: #2d4373;
        --adm-primary-ghost: #eef2ff;
        --adm-text: #1c2434;
        --adm-text-sub: #667085;
        --adm-accent: #226ad6;
      }
      .adm-root{
        background: radial-gradient(1200px 600px at 10% -10%, #f1f5ff, transparent) ,
                    radial-gradient(1000px 600px at 90% -20%, #f8fbff, transparent),
                    var(--adm-bg);
        min-height: 100%;
      }
      .adm-container{
        max-width: 1120px;
        margin: 38px auto;
        padding: 0 16px 46px;
      }
      .adm-tabbar{
        position: sticky;
        top: 0;
        z-index: 20;
        background: linear-gradient(to bottom, rgba(246,248,251,0.9), rgba(246,248,251,0.7));
        backdrop-filter: saturate(140%) blur(6px);
        border-bottom: 1px solid var(--adm-border);
        margin: 0 -16px 18px;
        padding: 10px 16px;
      }
      .adm-tabbar-inner{
        display: flex; gap: 6px; flex-wrap: wrap;
      }
      .adm-tab{
        appearance: none;
        border: 0;
        background: transparent;
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 700;
        color: var(--adm-text-sub);
        transition: 120ms ease;
        outline: none;
      }
      .adm-tab:hover{ background: #f1f4fa; color: var(--adm-text); }
      .adm-tab:focus-visible{
        box-shadow: 0 0 0 3px rgba(34,106,214,.18);
      }
      .adm-tab.active{
        background: var(--adm-primary-ghost);
        color: var(--adm-primary);
        border: 1px solid #dfe6ff;
      }
      .adm-grid{
        display: grid;
        grid-template-columns: minmax(0,1fr);
        gap: 14px;
      }
      .adm-row{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
      }
      .adm-card{
        background: var(--adm-card-bg);
        border: 1px solid var(--adm-border);
        border-radius: var(--adm-radius);
        box-shadow: var(--adm-shadow);
      }
      .adm-card-body{ padding: 14px; }
      .adm-card-head{
        padding: 14px 14px 0;
        display:flex; align-items:center; justify-content:space-between; gap:10px;
      }
      .adm-title{
        margin: 0; font-weight: 800; color: var(--adm-text);
        font-size: 17px; letter-spacing: -0.2px;
      }
      .adm-sub{
        margin: 6px 0 0; color: var(--adm-text-sub); font-size: 13px;
      }
      .adm-actions{ display:flex; gap:8px; }
      .adm-btn{
        appearance:none; border:1px solid var(--adm-border); background:#fff;
        border-radius:10px; padding:8px 12px; cursor:pointer;
      }
      .adm-btn.primary{
        border-color:#dfe6ff; background:var(--adm-primary-ghost); color:var(--adm-primary);
        font-weight:700;
      }
      .adm-section-gap{ display:grid; gap:14px; }
      .adm-pill{
        display:inline-flex; align-items:center; gap:6px;
        padding:6px 10px; border-radius:999px;
        background:#f6f8ff; color:#2b3f77; font-size:12px; border:1px solid #e3e9ff;
      }
    `;
    document.head.appendChild(style);
    return () => { /* keep styles */ };
  }, []);
}

// 공통 섹션 카드
function SectionCard({ title, subtitle, actions, children }) {
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <div>
          <h3 className="adm-title">{title}</h3>
          {subtitle ? <div className="adm-sub">{subtitle}</div> : null}
        </div>
        <div className="adm-actions">{actions}</div>
      </div>
      <div className="adm-card-body">{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`adm-tab ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function AdminDashboardTabs() {
  useInjectOnceStyle();

  // 탭 구성: 모두 기존 파일 재사용
  const tabs = useMemo(
    () => [
      { key: "report", label: "일일 리포트" },
      { key: "counsel", label: "상담·프로필·수업형태" },
      { key: "attendance", label: "출결 관리" },
      { key: "progress", label: "진도 관리" },
      { key: "subjects", label: "과목·단원" },
      { key: "students", label: "학생 정보" },
      { key: "schools", label: "학교 관리" },
      { key: "periods", label: "학교 일정/학기" },
      { key: "promo", label: "공지 · 팝업 배너" },
    ],
    []
  );

  const [tab, setTab] = useState(tabs[0].key);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  return (
    <div className="adm-root">
      <div className="adm-container">
        {/* 상단 탭바 */}
        <div className="adm-tabbar">
          <div className="adm-tabbar-inner" role="tablist" aria-label="Admin Dashboard Tabs">
            {tabs.map((t) => (
              <TabButton
                key={t.key}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </TabButton>
            ))}
          </div>
        </div>

        {/* 리포트 */}
        {tab === "report" && (
          <div className="adm-section-gap">
            <SectionCard
              title="자동 발송 · 자동 아웃"
              subtitle="리포트 자동 발송/퇴실 자동 처리 토글"
              actions={<span className="adm-pill">운영</span>}
            >
              <div className="adm-row">
                <div className="adm-card" style={{ border: "0", boxShadow: "none" }}>
                  <div className="adm-card-body">
                    <DailyReportAutoSwitch />
                  </div>
                </div>
                <div className="adm-card" style={{ border: "0", boxShadow: "none" }}>
                  <div className="adm-card-body">
                    <AutoLeaveSwitch />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="리포트 작성 · 발송"
              subtitle="일일 리포트 작성 후 바로 발송"
              actions={
                <>
                  <button className="adm-btn">가이드</button>
                </>
              }
            >
              <div className="adm-section-gap">
                <DailyReportEditor />
                <div>
                  <DailyReportSender />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 상담/프로필/수업형태 */}
        {tab === "counsel" && (
          <div className="adm-section-gap">
            <SectionCard
              title="상담 · 프로필 · 수업형태"
              subtitle="학생 상담 기록, 프로필, 수업 형태 관리"
            >
              <div className="adm-section-gap">
                <CounselManager />
                <StudentProfilePanel />
                <div className="adm-card" style={{ border: "0", boxShadow: "none" }}>
                  <div className="adm-card-body">
                    <ClassTypeManager />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 출결 관리 */}
        {tab === "attendance" && (
          <SectionCard title="출결 관리" subtitle="출석/지각/조퇴 등 출결 상태 관리">
            <AttendanceManager />
          </SectionCard>
        )}

        {/* 진도 관리 */}
        {tab === "progress" && (
          <SectionCard title="진도 관리" subtitle="강좌별/학생별 진도 현황 관리">
            <ProgressManager />
          </SectionCard>
        )}

        {/* 과목·단원 + 학생 할당 */}
        {tab === "subjects" && (
          <div className="adm-section-gap">
            <SectionCard title="과목 · 단원" subtitle="과목 선택 후 단원 관리">
              <SubjectManager onSelect={setSelectedSubject} />
            </SectionCard>

            {selectedSubject && (
              <SectionCard
                title={`선택 과목: ${selectedSubject.name}`}
                subtitle="단원 목록 및 학생 할당"
              >
                <div className="adm-grid">
                  <ChapterManager
                    subject={selectedSubject}
                    onChapterListChange={setChapterList}
                  />
                  <StudentAssignManager chapterList={chapterList} />
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* 학생 정보 */}
        {tab === "students" && (
          <SectionCard
            title="학생 정보"
            subtitle="검색 / 활성화 / 기본 정보 확인"
            actions={<span className="adm-pill">관리</span>}
          >
            <StudentManager />
          </SectionCard>
        )}

        {/* 학교 관리 */}
        {tab === "schools" && (
          <SectionCard
            title="학교 관리"
            subtitle="학교 추가/삭제 및 목록 관리"
            actions={<span className="adm-pill">데이터</span>}
          >
            <SchoolManager />
          </SectionCard>
        )}

        {/* 학교 일정/학기 */}
        {tab === "periods" && (
          <SectionCard
            title="학교 일정 · 학기 기간"
            subtitle="방학/학사일정 등 기간 관리"
            actions={<span className="adm-pill">일정</span>}
          >
            <SchoolPeriodManager />
          </SectionCard>
        )}

        {/* 공지 · 팝업 배너 */}
        {tab === "promo" && (
          <div className="adm-section-gap">
            <SectionCard title="공지사항" subtitle="공지 작성/수정/삭제">
              <AdminNoticeManager />
            </SectionCard>

            <SectionCard
              title="메인 팝업 배너"
              subtitle="이미지 업로드(Cloudflare 연결) + 텍스트/링크/표시여부"
            >
              {/* PopupBannerAdmin 자체 UI가 3개 배너를 관리한다면 한 번만 렌더 */}
              <div className="adm-grid">
                <PopupBannerAdmin />
              </div>
            </SectionCard>

            <SectionCard title="홍보/블로그 스위치" subtitle="공개 영역 표시 토글">
              <BlogSettingSwitch />
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
