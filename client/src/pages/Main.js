// client/src/pages/Main.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PopupBanners from "../components/PopupBanners";
import Blog from "./Blog";
import KakaoMap from "../components/KakaoMap";

import { fetchPublicSiteSettings } from "../utils/sitePublic";
import { API_URL } from "../api";

/**
 * 홈 섹션 토글:
 *  - 서버(슈퍼 설정)에서 관리되는 home_sections 배열을 읽어 활성 섹션만 렌더링
 *  - 지원 key: hero, features, stats, cta
 */
const DEFAULT_SECTIONS = [
  { key: "hero", on: true },
  { key: "features", on: true },
  { key: "stats", on: true },
  { key: "cta", on: true },
];

export default function Main() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);

  // 블로그 노출 유지 (기존 동작)
  const [showBlog, setShowBlog] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) 공개 사이트 설정에서 home_sections 읽기
        const r = await fetchPublicSiteSettings(); // { ok, settings: { home_sections: [...] } }
        if (r?.ok && Array.isArray(r.settings?.home_sections)) {
          const safe = r.settings.home_sections
            .filter((s) => s && typeof s.key === "string")
            .map((s) => ({ key: s.key, on: s.on !== false }));
          setSections(safe.length ? safe : DEFAULT_SECTIONS);
        } else {
          setSections(DEFAULT_SECTIONS);
        }
      } catch {
        setSections(DEFAULT_SECTIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // 2) 기존처럼 blog_show 설정에 따라 블로그 섹션 노출
    fetch(`${API_URL}/api/settings/blog_show`)
      .then((res) => res.json())
      .then((data) => setShowBlog(data.show))
      .catch(() => setShowBlog(true));
  }, []);

  const activeKeys = useMemo(
    () => sections.filter((s) => s.on).map((s) => s.key),
    [sections]
  );

  if (loading) {
    return (
      <div style={{ maxWidth: 1080, margin: "48px auto", padding: "0 4vw", color: "#888" }}>
        로딩 중…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 4vw" }}>
      {/* 팝업 배너(기존 유지) */}
      <div style={{ margin: "18px 0" }}>
        <PopupBanners />
      </div>

      {/* 토글된 섹션을 순서대로 렌더링 */}
      {activeKeys.map((key) => (
        <Section key={key} kind={key} />
      ))}

      {/* 위치 안내(기존 유지) — 섹션 토글에는 포함되지 않지만 계속 노출 */}
      <LocationSection />

      {/* 블로그 최신글(기존 유지) */}
      {showBlog && <Blog limit={3} />}
    </div>
  );
}

/* 섹션 렌더러 (home_sections 토글 대상) */
function Section({ kind }) {
  switch (kind) {
    case "hero":
      return <HeroSection />;
    case "features":
      return <FeaturesSection />;
    case "stats":
      return <StatsSection />;
    case "cta":
      return <CTASection />;
    default:
      return null; // 알 수 없는 key는 무시
  }
}

/* ====== 토글 섹션들 ====== */

function HeroSection() {
  return (
    <div
      className="card"
      style={{
        padding: "36px 26px",
        margin: "28px 0",
        background:
          "linear-gradient(180deg, rgba(34,106,214,0.07) 0%, rgba(34,106,214,0.00) 70%)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.6, marginBottom: 8 }}>
            IG수학학원
          </div>
          <h1 style={{ margin: 0, fontSize: 36, lineHeight: "44px" }}>
            학생별 맞춤 학습 리포트와
            <br />
            출결·진도·상담까지 한 번에
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 10 }}>
            데일리 리포트, 수업형태(ClassType), 반 캘린더, 상담 이력까지 — 학부모에게는 투명하게, 내부 운영은 더 효율적으로.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Link to="/contact" className="btn-primary" style={{ textDecoration: "none" }}>
              상담 문의하기
            </Link>
            <Link to="/materials" className="btn" style={{ textDecoration: "none" }}>
              학습 자료실
            </Link>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <DemoTiles />
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const items = [
    {
      title: "데일리 리포트 자동 발송",
      desc: "예약/선택/일괄 발송 지원. 알림톡 템플릿과 공개 열람 링크 제공.",
    },
    {
      title: "출결·진도·상담 통합",
      desc: "출결 시간과 리포트를 동기화하고, 상담 메모를 누적 관리.",
    },
    {
      title: "반(그룹)·강사 권한",
      desc: "강사는 담당 반/학생만, 운영자/슈퍼는 전체 데이터를 확인.",
    },
  ];
  return (
    <div className="card" style={{ padding: 22, margin: "18px 0" }}>
      <h2 style={{ marginTop: 0 }}>핵심 기능</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {items.map((it, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{it.title}</div>
            <div style={{ color: "var(--text-muted)" }}>{it.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSection() {
  const stats = [
    { k: "일일 리포트", v: "자동/예약/대량" },
    { k: "출결 동기화", v: "학습시간 산출" },
    { k: "강사 스코프", v: "반/학생 제한" },
    { k: "상담 기록", v: "공개/비공개" },
  ];
  return (
    <div className="card" style={{ padding: 22, margin: "18px 0" }}>
      <h2 style={{ marginTop: 0 }}>운영 하이라이트</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{s.k}</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <div className="card" style={{ padding: 26, margin: "18px 0", textAlign: "center" }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>지금 바로 적용해 보세요</h2>
      <p style={{ color: "var(--text-muted)", marginTop: 0, marginBottom: 16 }}>
        홈 메뉴/섹션/테마는 슈퍼관리자에서 즉시 변경됩니다.
      </p>
      <Link to="/contact" className="btn-primary" style={{ textDecoration: "none" }}>
        상담 문의하기
      </Link>
    </div>
  );
}

/* ====== 기존 유지 섹션(토글 외) ====== */

function LocationSection() {
  return (
    <div className="card" style={{ padding: 22, margin: "18px 0" }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>위치 안내</h2>
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        서울특별시 강남구 삼성로64길-5 2층 204호 IG수학
      </p>
      <div>
        <KakaoMap />
      </div>
    </div>
  );
}

/* 시각적 플레이스홀더 */
function DemoTiles() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 64,
            borderRadius: 10,
            border: "1px dashed var(--border)",
            background: "rgba(34,106,214,0.06)",
          }}
        />
      ))}
    </div>
  );
}
