// client/src/components/ResponsiveNavBar.js
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePublicSiteSettings } from "../utils/sitePublic";
import { useIsMobile } from "../hooks/useMediaQuery";

function ResponsiveNavBar() {
  const { settings, loading } = usePublicSiteSettings();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // 모바일 메뉴가 열리면 스크롤 차단
  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    setRole(null);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  // 메뉴 설정
  const showHome = settings?.menu_home_on ?? false;
  const showNews = settings?.menu_news_on ?? false;
  const showBlog = settings?.menu_blog_on ?? false;
  const showMaterials = settings?.menu_materials_on ?? false;
  const showContact = settings?.menu_contact_on ?? false;
  const showTeachers = settings?.menu_teachers_on ?? false;

  // 브랜딩 설정
  const academyName = settings?.academy_name || 'IG수학학원';
  const primaryColor = settings?.primary_color || '#2d4373';

  // 햄버거 메뉴 아이콘 컴포넌트
  const HamburgerIcon = ({ isOpen, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        width: '30px',
        height: '30px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0',
        zIndex: 1001
      }}
      aria-label="메뉴 열기"
    >
      <div style={{
        width: '30px',
        height: '3px',
        background: 'white',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
        transform: isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
      }} />
      <div style={{
        width: '30px',
        height: '3px',
        background: 'white',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
        opacity: isOpen ? 0 : 1
      }} />
      <div style={{
        width: '30px',
        height: '3px',
        background: 'white',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
        transform: isOpen ? 'rotate(-45deg) translate(8px, -8px)' : 'none'
      }} />
    </button>
  );

  // 메뉴 링크 스타일
  const linkStyle = {
    color: "white",
    textDecoration: "none",
    whiteSpace: "nowrap",
    padding: isMobile ? "12px 0" : "8px 12px",
    display: "block",
    borderRadius: isMobile ? "0" : "4px",
    transition: "all 0.2s ease",
    fontSize: isMobile ? "16px" : "14px",
    fontWeight: isMobile ? "500" : "normal"
  };

  const logoStyle = {
    color: "white",
    fontWeight: "bold",
    fontSize: isMobile ? "18px" : "20px",
    textDecoration: "none",
    whiteSpace: "nowrap"
  };

  const buttonStyle = {
    background: "#fff",
    color: primaryColor,
    border: "none",
    borderRadius: "6px",
    padding: isMobile ? "12px 20px" : "8px 16px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: isMobile ? "16px" : "14px",
    marginTop: isMobile ? "16px" : "0"
  };

  // 공통 메뉴 항목들
  const publicMenuItems = [
    { show: showNews, to: "/news", label: "공지사항" },
    { show: showContact, to: "/contact", label: "상담문의" },
    { show: showBlog, to: "/blog", label: "블로그최신글" },
    { show: showMaterials, to: "/materials", label: "자료실" },
    { show: showTeachers, to: "/teachers", label: "강사진" }
  ].filter(item => item.show);

  const userMenuItems = [
    { show: role === "admin" || role === "super", to: "/dashboard", label: "관리자 대시보드" },
    { show: role === "teacher", to: "/dashboard", label: "강사 대시보드" },
    { show: role === "student", to: "/dashboard", label: "내 강의실" },
    { show: role === "super", to: "/super-settings", label: "슈퍼 설정" }
  ].filter(item => item.show);

  if (isMobile) {
    // 모바일 레이아웃
    return (
      <>
        {/* 모바일 네비게이션 바 */}
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: primaryColor,
          padding: "16px 20px",
          marginBottom: "24px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          minHeight: "60px"
        }}>
          {/* 로고 */}
          {showHome && (
            <Link style={logoStyle} to="/">
              {academyName}
            </Link>
          )}

          {/* 햄버거 메뉴 버튼 */}
          <HamburgerIcon
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </nav>

        {/* 모바일 오버레이 메뉴 */}
        {mobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              background: primaryColor,
              width: '280px',
              height: '100vh',
              padding: '80px 30px 30px 30px',
              overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
            }}>
              {/* 공개 메뉴들 */}
              {publicMenuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.to}
                  style={{
                    ...linkStyle,
                    borderBottom: index < publicMenuItems.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* 구분선 */}
              {userMenuItems.length > 0 && (
                <div style={{
                  height: '1px',
                  background: 'rgba(255,255,255,0.3)',
                  margin: '20px 0'
                }} />
              )}

              {/* 사용자 메뉴들 */}
              {userMenuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.to}
                  style={{
                    ...linkStyle,
                    borderBottom: index < userMenuItems.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* 로그인/로그아웃 */}
              {role ? (
                <button
                  onClick={handleLogout}
                  style={buttonStyle}
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  to="/login"
                  style={{
                    ...buttonStyle,
                    textDecoration: 'none',
                    display: 'inline-block',
                    textAlign: 'center'
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              )}

              {/* 소셜 미디어 링크 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.3)'
              }}>
                <a
                  href="https://blog.naver.com/igmath2022"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    background: '#03c75a',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: '16px'
                  }}
                >
                  네이버블로그
                </a>
                <a
                  href="https://www.youtube.com/@%EC%86%A1%EC%9D%B8%EA%B7%9C-m1r"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    background: '#ff0000',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: '16px'
                  }}
                >
                  유튜브
                </a>
                <a
                  href="https://pf.kakao.com/_dSHvxj"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#333',
                    background: '#FEE500',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: '16px'
                  }}
                >
                  카카오문의
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 데스크톱 레이아웃 (기존과 유사하지만 개선)
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: primaryColor,
      padding: "12px 4vw",
      marginBottom: "24px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      minHeight: "60px"
    }}>
      {/* 왼쪽 메뉴들 */}
      <div style={{
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
        flex: 1,
        minWidth: 0
      }}>
        {showHome && (
          <Link style={logoStyle} to="/">
            {academyName}
          </Link>
        )}

        {publicMenuItems.map((item, index) => (
          <Link key={index} style={linkStyle} to={item.to}>
            {item.label}
          </Link>
        ))}
      </div>

      {/* 오른쪽 메뉴들 */}
      <div style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        flexShrink: 0,
        flexWrap: "wrap"
      }}>
        {userMenuItems.map((item, index) => (
          <Link key={index} style={linkStyle} to={item.to}>
            {item.label}
          </Link>
        ))}

        {role ? (
          <button onClick={handleLogout} style={buttonStyle}>
            로그아웃
          </button>
        ) : (
          <Link to="/login" style={{...buttonStyle, textDecoration: 'none', display: 'inline-block'}}>
            로그인
          </Link>
        )}

        {/* 데스크톱 소셜 미디어 링크 */}
        <a
          href="https://blog.naver.com/igmath2022"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'white',
            background: '#03c75a',
            borderRadius: '12px',
            padding: '3px 12px',
            fontWeight: 'bold',
            textDecoration: 'none',
            marginLeft: '8px',
            fontSize: '14px'
          }}
        >
          네이버블로그
        </a>
        <a
          href="https://www.youtube.com/@%EC%86%A1%EC%9D%B8%EA%B7%9C-m1r"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'white',
            background: '#ff0000',
            borderRadius: '12px',
            padding: '3px 12px',
            fontWeight: 'bold',
            textDecoration: 'none',
            marginLeft: '8px',
            fontSize: '14px'
          }}
        >
          유튜브
        </a>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#333',
            background: '#FEE500',
            borderRadius: '12px',
            padding: '3px 12px',
            fontWeight: 'bold',
            textDecoration: 'none',
            marginLeft: '8px',
            fontSize: '14px'
          }}
        >
          카카오문의
        </a>
      </div>
    </nav>
  );
}

export default ResponsiveNavBar;