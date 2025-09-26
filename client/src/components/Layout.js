// client/src/components/Layout.js
import React, { useEffect } from "react";
import ResponsiveNavBar from "./ResponsiveNavBar";
import FloatingContact from "./FloatingContact";
import { Outlet } from "react-router-dom";
import { ensureThemeOnFirstPaint } from "../utils/sitePublic";

// 모듈 로드 시점(가능한 빨리) 테마 적용
ensureThemeOnFirstPaint();

function Layout({ hideNavBar }) {
  useEffect(() => {
    // 세션 시작 마커
    const marker = sessionStorage.getItem("session-started");
    if (!marker) {
      sessionStorage.setItem("session-started", "1");
      const hadAuth = localStorage.getItem("token") || localStorage.getItem("role");
      if (hadAuth) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth-changed"));
      }
    }
  }, []);

  return (
    <>
      {!hideNavBar && <ResponsiveNavBar />}
      <div>
        <Outlet />
      </div>
      {!hideNavBar && <FloatingContact />}
    </>
  );
}

export default Layout;
