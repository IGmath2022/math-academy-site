import React, { memo, useMemo } from "react";
import Blog from "./Blog";
import KakaoMap from "../components/KakaoMap";
import PopupBanners from "../components/PopupBanners";
import { useSiteSettings } from "../context/SiteSettingsContext";

const Section = memo(function Section({ title, children }) {
  const sectionStyle = useMemo(() => ({ marginBottom: 30 }), []);
  const titleStyle = useMemo(() => ({ fontSize: 20, marginBottom: 8 }), []);

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      {children}
    </section>
  );
});

export default function Main() {
  const { ready, home } = useSiteSettings();

  const skeletonStyles = useMemo(
    () => ({
      spacer: { height: 18 },
      title: { height: 24, width: 180, background: "#00000010", borderRadius: 8, margin: "0 auto 10px" },
      subtitle: { height: 14, width: 260, background: "#00000008", borderRadius: 6, margin: "0 auto 24px" },
      content: { height: 120, background: "#00000006", borderRadius: 12 },
    }),
    []
  );

  if (!ready) {
    return (
      <div className="container" style={wrapStyle}>
        <div style={skeletonStyles.spacer} />
        <div style={skeletonStyles.title} />
        <div style={skeletonStyles.subtitle} />
        <div style={skeletonStyles.content} />
      </div>
    );
  }

  const byKey = Object.fromEntries((home?.sections || []).map((s) => [s.key, !!s.on]));
  const hero = home?.hero || {};
  const about = home?.about || {};

  console.log('Main.js - home:', home);
  console.log('Main.js - byKey:', byKey);
  console.log('Main.js - blog section condition:', byKey.blog !== false && home?.blog_show !== false);

  return (
    <div className="container" style={wrapStyle}>
      <PopupBanners />

      {byKey.hero !== false && (
        <header style={{ textAlign: "center", marginBottom: 38 }}>
          {hero.logoUrl && (
            <img
              src={hero.logoUrl}
              alt="학원 로고"
              style={{ width: 96, height: 96, objectFit: "contain", borderRadius: 18, marginBottom: 10 }}
            />
          )}
          <h1 style={{ fontSize: 32, marginBottom: 10, letterSpacing: "-1px" }}>
            {hero.title || "IG수학학원"}
          </h1>
          {(hero.subtitle || "") && (
            <p style={{ color: "#456", fontSize: 16, margin: 0, marginTop: 4 }}>{hero.subtitle}</p>
          )}
        </header>
      )}

      {byKey.about !== false && (
        <Section title="학원 소개">
          <p style={{ lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap" }}>
            {about.md || "학생 맞춤 커리큘럼으로 실력을 키워갑니다."}
          </p>
        </Section>
      )}

      {byKey.schedule !== false && (
        <Section title="위치 안내">
          <p style={{ color: "#444" }}>
            서울특별시 강남구 학원로 24, 5층 204호 (IG수학학원)
          </p>
          <div>
            <KakaoMap />
          </div>
        </Section>
      )}

      {byKey.teachers !== false && (
        <Section title="강사진 소개">
          {home?.teachers_intro && (
            <p style={{ color: "#444", marginBottom: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {home.teachers_intro}
            </p>
          )}
          {home?.teachers_list ? (
            <div style={{ color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {home.teachers_list}
            </div>
          ) : (
            <ul style={{ paddingLeft: 18, color: "#333", margin: 0 }}>
              <li style={{ marginBottom: 7 }}>원장 홍길동: 수학 교육 경력 10년</li>
            </ul>
          )}
        </Section>
      )}

      {byKey.blog !== false && home?.blog_show !== false && <Blog limit={3} />}

      <footer style={{ textAlign: "center", marginTop: 42, color: "#666" }}>
        <p style={{ fontSize: 15, marginBottom: 10 }}>문의: 02-563-2925</p>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={kakaoBtn}
        >
          카카오톡 1:1 문의 바로가기
        </a>
      </footer>
    </div>
  );
}

const wrapStyle = {
  maxWidth: 480,
  margin: "48px auto",
  padding: "32px 5vw",
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 2px 18px #0001",
  minHeight: 420,
};

const kakaoBtn = {
  display: "inline-block",
  background: "#FEE500",
  color: "#181600",
  fontWeight: "bold",
  padding: "13px 0",
  width: "98%",
  borderRadius: 20,
  textDecoration: "none",
  marginTop: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  fontSize: 17,
  letterSpacing: "-0.5px",
};
