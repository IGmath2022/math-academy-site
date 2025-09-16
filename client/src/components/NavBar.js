import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function readRole() {
  // 세션 우선, 없으면 로컬
  return sessionStorage.getItem("role") || localStorage.getItem("role") || null;
}

export default function NavBar() {
  // 새 세션이면 로그인 표시 안착시키기
  const initialRole = (() => {
    if (!sessionStorage.getItem("session-started")) return null;
    return readRole();
  })();

  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    const syncRole = () => setRole(readRole());
    window.addEventListener("auth-changed", syncRole);
    window.addEventListener("storage", syncRole);
    // (선택) 공개 설정 변경 이벤트가 있으면 여기서 색/노출 갱신 가능
    window.addEventListener("site-settings-updated", syncRole);
    syncRole();
    return () => {
      window.removeEventListener("auth-changed", syncRole);
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("site-settings-updated", syncRole);
    };
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.dispatchEvent(new Event("auth-changed"));
    } finally {
      // 훅 없이 안전하게 이동
      window.location.assign("/login");
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#2d4373",
        padding: "10px 4vw",
        marginBottom: 24,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <Link style={{ color: "white", fontWeight: "bold", fontSize: 20, textDecoration: "none" }} to="/">
          IG수학학원
        </Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/news">
          공지사항
        </Link>
        <Link to="/contact" style={{ color: "#fff", textDecoration: "none" }}>
          상담문의
        </Link>
        <Link to="/blog" style={{ color: "#fff", textDecoration: "none" }}>
          블로그최신글
        </Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/materials">
          자료실
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {(role === "admin" || role === "super") && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">
            관리자 대시보드
          </Link>
        )}
        {role === "super" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/super-settings">
            슈퍼 설정
          </Link>
        )}
        {role === "teacher" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">
            강사 대시보드
          </Link>
        )}
        {role === "student" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">
            내 강의실
          </Link>
        )}

        {role ? (
          <button
            onClick={handleLogout}
            style={{
              background: "#fff",
              color: "#2d4373",
              border: "none",
              borderRadius: 8,
              padding: "6px 18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        ) : (
          <>
            <Link style={{ color: "white", textDecoration: "none" }} to="/login">
              로그인
            </Link>
            <Link style={{ color: "white", textDecoration: "none" }} to="/register">
              회원가입
            </Link>
          </>
        )}

        <a
          href="https://blog.naver.com/igmath2022"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            background: "#03c75a",
            borderRadius: 12,
            padding: "3px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            marginLeft: 8,
          }}
        >
          네이버블로그
        </a>
        <a
          href="https://www.youtube.com/@%EC%86%A1%EC%9D%B8%EA%B7%9C-m1r"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            background: "#ff0000",
            borderRadius: 12,
            padding: "3px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            marginLeft: 8,
          }}
        >
          유튜브
        </a>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            background: "#FEE500",
            borderRadius: 12,
            padding: "3px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            marginLeft: 8,
          }}
        >
          카카오문의
        </a>
      </div>
    </nav>
  );
}
