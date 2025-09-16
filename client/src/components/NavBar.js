import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchPublicSiteSettings, applyTheme } from "../utils/sitePublic";

function NavBar() {
  const initialRole = (() => {
    if (!sessionStorage.getItem("session-started")) return null;
    return sessionStorage.getItem("role") || localStorage.getItem("role");
  })();

  const [role, setRole] = useState(initialRole);
  const [site, setSite] = useState({
    menu_home_on: true,
    menu_blog_on: true,
    menu_materials_on: true,
    menu_contact_on: true,
    site_theme_color: "#2d4373",
    site_theme_mode: "light",
  });

  const location = useLocation();
  const navigate = useNavigate();

  const refetchSite = async () => {
    try {
      const r = await fetchPublicSiteSettings();
      if (r?.ok && r.settings) {
        setSite(r.settings);
        applyTheme(r.settings);
      }
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    const syncRole = () => setRole(sessionStorage.getItem("role") || localStorage.getItem("role"));
    window.addEventListener("auth-changed", syncRole);
    window.addEventListener("storage", syncRole);
    // 설정 갱신 이벤트 (슈퍼 화면에서 저장 시)
    window.addEventListener("site-settings-updated", refetchSite);

    syncRole();
    refetchSite();

    return () => {
      window.removeEventListener("auth-changed", syncRole);
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("site-settings-updated", refetchSite);
    };
  }, []);

  useEffect(() => {
    setRole(sessionStorage.getItem("role") || localStorage.getItem("role"));
  }, [location]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    setRole(null);
    navigate("/login");
  };

  const navBg = "var(--nav-bg)";
  const navText = "var(--nav-text)";

  return (
    <nav style={{
      display: "flex", flexWrap: "wrap", justifyContent: "space-between",
      alignItems: "center", background: navBg, padding: "10px 4vw", marginBottom: 24,
      position: "sticky", top: 0, zIndex: 100
    }}>
      {/* 좌측 메뉴 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {site.menu_home_on && (
          <Link style={{ color: navText, fontWeight: "bold", fontSize: 20, textDecoration: "none" }} to="/">IG수학학원</Link>
        )}
        {/* 공지 탭은 기존 유지(숨김 옵션 없던 항목) */}
        <Link style={{ color: navText, textDecoration: "none" }} to="/news">공지사항</Link>
        {site.menu_contact_on && (
          <Link to="/contact" style={{ color: navText, textDecoration: "none" }}>상담문의</Link>
        )}
        {site.menu_blog_on && (
          <Link to="/blog" style={{ color: navText, textDecoration: "none" }}>블로그최신글</Link>
        )}
        {site.menu_materials_on && (
          <Link style={{ color: navText, textDecoration: "none" }} to="/materials">자료실</Link>
        )}
      </div>

      {/* 우측 계정/바로가기 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {role === "super" && (
          <>
            <Link style={{ color: navText, textDecoration: "none" }} to="/dashboard">관리자 대시보드</Link>
            <Link style={{ color: navText, textDecoration: "none", fontWeight: 800 }} to="/admin/super-settings">슈퍼 설정</Link>
          </>
        )}
        {role === "admin" && (
          <Link style={{ color: navText, textDecoration: "none" }} to="/dashboard">관리자 대시보드</Link>
        )}
        {role === "teacher" && (
          <Link style={{ color: navText, textDecoration: "none" }} to="/dashboard">강사 대시보드</Link>
        )}
        {role === "student" && (
          <Link style={{ color: navText, textDecoration: "none" }} to="/dashboard">내 강의실</Link>
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
              cursor: "pointer"
            }}
          >
            로그아웃
          </button>
        ) : (
          <>
            <Link style={{ color: navText, textDecoration: "none" }} to="/login">로그인</Link>
            <Link style={{ color: navText, textDecoration: "none" }} to="/register">회원가입</Link>
          </>
        )}

        {/* 외부 링크(그대로 유지) */}
        <a
          href="https://blog.naver.com/igmath2022"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: navText, background: "#03c75a", borderRadius: 12, padding: "3px 12px", fontWeight: "bold", textDecoration: "none", marginLeft: 8 }}
        >
          네이버블로그
        </a>
        <a
          href="https://www.youtube.com/@%EC%86%A1%EC%9D%B8%EA%B7%9C-m1r"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: navText, background: "#ff0000", borderRadius: 12, padding: "3px 12px", fontWeight: "bold", textDecoration: "none", marginLeft: 8 }}
        >
          유튜브
        </a>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: navText, background: "#FEE500", borderRadius: 12, padding: "3px 12px", fontWeight: "bold", textDecoration: "none", marginLeft: 8 }}
        >
          카카오문의
        </a>
      </div>
    </nav>
  );
}

export default NavBar;
