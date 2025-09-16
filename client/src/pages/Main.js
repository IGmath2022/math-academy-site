// client/src/pages/Main.js
import React, { useEffect, useState } from "react";
import Blog from "./Blog";
import KakaoMap from "../components/KakaoMap";
import PopupBanners from "../components/PopupBanners";
import { API_URL } from "../api";

export default function Main() {
  const [showBlog, setShowBlog] = useState(true);
  const [safe, setSafe] = useState({ bannersOk: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/settings/blog_show`);
        if (!cancelled && r.ok) {
          const j = await r.json().catch(() => ({}));
          setShowBlog(!!j.show);
        }
      } catch {
        // 실패해도 그냥 기본값 유지
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="container"
      style={{
        maxWidth: 420,
        margin: "48px auto",
        padding: "32px 5vw",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 18px #0001",
        minHeight: 420,
      }}
    >
      {/* 배너 쪽에서 에러 나도 초기 렌더는 유지 */}
      {safe.bannersOk ? (
        <ErrorBoundary onError={() => setSafe(s => ({ ...s, bannersOk: false }))}>
          <PopupBanners />
        </ErrorBoundary>
      ) : null}

      <header style={{ textAlign: "center", marginBottom: 38 }}>
        <h1 style={{ fontSize: 32, marginBottom: 10, letterSpacing: "-1px" }}>IG수학학원</h1>
        <p style={{ color: "#456", fontSize: 16, margin: 0, marginTop: 4 }}>
          학생의 꿈과 성장을 함께하는<br />개별맞춤 수학 전문 학원
        </p>
      </header>

      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>학원 소개</h2>
        <p style={{ lineHeight: 1.7, color: "#333" }}>
          IG수학학원은 학생 한 명, 한 명의 실력과 진로에 맞춘 맞춤형 커리큘럼으로
          수학 실력은 물론 자기주도 학습 역량까지 함께 키워나갑니다.
        </p>
      </section>

      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>위치 안내</h2>
        <p style={{ color: "#444" }}>
          서울특별시 강남구 삼성로64길-5 2층 204호 IG수학
        </p>
        <div><KakaoMap /></div>
      </section>

      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>강사진 소개</h2>
        <ul style={{ paddingLeft: 18, color: "#333", margin: 0 }}>
          <li style={{ marginBottom: 7 }}>송인규 원장: 성균관대 수학과, 10년 경력</li>
        </ul>
      </section>

      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>커리큘럼·시간표 요약</h2>
        <ul style={{ paddingLeft: 18, color: "#333", margin: 0 }}>
          <li style={{ marginBottom: 6 }}>초등부: 평일 15:00~22:00, 토 10:00~17:00</li>
          <li style={{ marginBottom: 6 }}>중고등부: 평일 16:00~22:00, 토 10:00~17:00</li>
          <li style={{ marginBottom: 6 }}>여름·겨울방학: 평일 11:00~20:00, 토 10:00~17:00</li>
        </ul>
      </section>

      {showBlog && <Blog limit={3} />}

      <footer style={{ textAlign: "center", marginTop: 42, color: "#666" }}>
        <p style={{ fontSize: 15, marginBottom: 10 }}>문의: 02-563-2925</p>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={{
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
          }}
        >
          카카오톡 1:1 문의 바로가기
        </a>
      </footer>
    </div>
  );
}

/* ---- 아주 얇은 에러 바운더리 ---- */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(){ this.props.onError && this.props.onError(); }
  render(){ return this.state.hasError ? null : this.props.children; }
}
