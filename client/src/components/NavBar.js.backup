// client/src/components/NavBar.js
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePublicSiteSettings } from "../utils/sitePublic";

function NavBar() {
  // 세션 초기화 로직과는 별개로, 메뉴 노출은 공개설정에 의해 제어
  const { settings, loading } = usePublicSiteSettings();

  const initialRole = (() => {
    if (!sessionStorage.getItem("session-started")) return null;
    return localStorage.getItem("role");
  })();

  const [role, setRole] = useState(initialRole);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const syncRole = () => setRole(localStorage.getItem("role"));
    window.addEventListener("auth-changed", syncRole);
    window.addEventListener("storage", syncRole);
    syncRole();
    return () => {
      window.removeEventListener("auth-changed", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    setRole(null);
    navigate("/login");
  };


  // 공개설정이 아직 로드 전이라면 "잠깐 숨김" -> 깜빡임 방지
  // 단, 캐시가 있으면 이미 settings가 있으므로 로딩 중에도 올바른 메뉴가 보입니다.
  const showHome      = settings?.menu_home_on ?? false;
  const showNews      = settings?.menu_news_on ?? false;
  const showBlog      = settings?.menu_blog_on ?? false;
  const showMaterials = settings?.menu_materials_on ?? false;
  const showContact   = settings?.menu_contact_on ?? false;
  const showTeachers  = settings?.menu_teachers_on ?? false;

  // 브랜딩 설정
  const academyName = settings?.academy_name || 'IG수학학원';
  const primaryColor = settings?.primary_color || '#2d4373';


  return (
    <nav style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", background: primaryColor, padding: "10px 4vw",
      marginBottom: 24, position: "sticky", top: 0, zIndex: 100,
      minHeight: "60px"
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "nowrap", overflow: "visible" }}>
        {showHome && (
          <Link style={{ color: "white", fontWeight: "bold", fontSize: 20, textDecoration: "none", whiteSpace: "nowrap" }} to="/">{academyName}</Link>
        )}
        {showBlog && <Link style={{ color: "white", textDecoration: "none", whiteSpace: "nowrap" }} to="/news">공지사항</Link>}
        {showContact && <Link to="/contact" style={{ color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}>상담문의</Link>}
        {showBlog && <Link to="/blog" style={{ color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}>블로그최신글</Link>}
        {showMaterials && <Link style={{ color: "white", textDecoration: "none", whiteSpace: "nowrap" }} to="/materials">자료실</Link>}
        {showTeachers && <Link style={{ color: "white", textDecoration: "none", whiteSpace: "nowrap" }} to="/teachers">강사진</Link>}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {(role === "admin" || role === "super") && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">관리자 대시보드</Link>
        )}
        {role === "teacher" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">강사 대시보드</Link>
        )}
        {role === "student" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">내 강의실</Link>
        )}
        {role === "super" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/super-settings">슈퍼 설정</Link>
        )}

        {role ? (
          <button
            onClick={handleLogout}
            style={{
              background: "#fff",
              color: primaryColor,
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
