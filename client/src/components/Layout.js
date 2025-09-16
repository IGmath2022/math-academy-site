import React, { useEffect } from "react";
import NavBar from "./NavBar";
import FloatingContact from "./FloatingContact";
import { Outlet } from "react-router-dom";
import "../theme.css"; // ✅ 전역 테마 CSS 로딩

function Layout({ hideNavBar = false }) {
  // 새 브라우저 세션이면(localStorage 잔존) 강제 로그아웃
  useEffect(() => {
    // sessionStorage는 브라우저/앱을 완전히 닫으면 초기화됨
    const marker = sessionStorage.getItem("session-started");
    if (!marker) {
      sessionStorage.setItem("session-started", "1");
      const hadAuth = localStorage.getItem("token") || localStorage.getItem("role");
      if (hadAuth) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        // NavBar 등에게 즉시 상태 변경 알림
        window.dispatchEvent(new Event("auth-changed"));
      }
    }
  }, []);

  return (
    <>
      {!hideNavBar && <NavBar />}
      <div>
        <Outlet />
      </div>
      {!hideNavBar && <FloatingContact />}
    </>
  );
}

export default Layout;
