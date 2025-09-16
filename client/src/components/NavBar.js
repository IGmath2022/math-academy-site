import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";

function NavBar() {
  const { ready, menu, theme } = useSiteSettings();
  const [role, setRole] = useState(() => {
    if (!sessionStorage.getItem("session-started")) return null;
    return localStorage.getItem("role") || sessionStorage.getItem("role");
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const syncRole = () => setRole(localStorage.getItem("role") || sessionStorage.getItem("role"));
    window.addEventListener("auth-changed", syncRole);
    window.addEventListener("storage", syncRole);
    syncRole();
    return () => {
      window.removeEventListener("auth-changed", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem("role") || sessionStorage.getItem("role"));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    setRole(null);
    navigate("/login");
  };

  if (!ready) {
    return (
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#2d4373", padding: "12px 4vw", marginBottom: 24
      }}>
        <div style={{ height: 20, width: 140, background: "#ffffff33", borderRadius: 6 }} />
        <div style={{ height: 20, width: 260, background: "#ffffff33", borderRadius: 6 }} />
      </nav>
    );
  }

  const brandColor = theme?.color || "#2d4373";

  return (
    <nav style={{
      display: "flex", flexWrap: "wrap", justifyContent: "space-between",
      alignItems: "center", background: brandColor, padding: "10px 4vw", marginBottom: 24,
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {menu?.home !== false && (
          <Link style={{ color: "white", fontWeight: "bold", fontSize: 20, textDecoration: "none" }} to="/">IG수학학원</Link>
        )}
        {menu?.blog && <Link style={{ color: "white", textDecoration: "none" }} to="/news">공지사항</Link>}
        {menu?.contact && <Link to="/contact" style={{ color: "#fff", textDecoration: "none" }}>상담문의</Link>}
        {menu?.blog && <Link to="/blog" style={{ color: "#fff", textDecoration: "none" }}>블로그최신글</Link>}
        {menu?.materials && <Link style={{ color: "white", textDecoration: "none" }} to="/materials">자료실</Link>}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {(role === "admin" || role === "super") && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">관리자 대시보드</Link>
        )}
        {role === "super" && (
          <Link style={{ color: "white", textDecoration: "none", fontWeight: 800 }} to="/super-settings">
            슈퍼 설정
          </Link>
        )}
        {role === "teacher" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">강사 대시보드</Link>
        )}
        {role === "student" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">내 강의실</Link>
        )}
        {role ? (
          <button
            onClick={handleLogout}
            style={{
              background: "#fff",
              color: brandColor,
              border: "none",
              borderRadius: 8,
              padding: "6px 18px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            로그아웃
          </button>
        ) : (
          <>
            <Link style={{ color: "white", textDecoration: "none" }} to="/login">로그인</Link>
            <Link style={{ color: "white", textDecoration: "none" }} to="/register">회원가입</Link>
          </>
        )}
        <a
          href="https://blog.naver.com/igmath2022"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", background: "#03c75a", borderRadius: 12, padding: "3px 12px", fontWeight: "bold", textDecoration: "none", marginLeft: 8 }}
        >
          네이버블로그
        </a>
        <a
          href="https://www.youtube.com/@%EC%86%A1%EC%9D%B8%EA%B7%9C-m1r"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", background: "#ff0000", borderRadius: 12, padding: "3px 12px", fontWeight: "bold", textDecoration: "none", marginLeft: 8 }}
        >
          유튜브
        </a>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", background: "#FEE500", borderRadius: 12, padding: "3px 12px", fontWeight: "bold", textDecoration: "none", marginLeft: 8 }}
        >
          카카오문의
        </a>
      </div>
    </nav>
  );
}

export default NavBar;
