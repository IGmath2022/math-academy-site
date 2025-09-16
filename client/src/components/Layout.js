import React, { useEffect } from "react";
import NavBar from "./NavBar";
import FloatingContact from "./FloatingContact";
import { Outlet } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";

function Layout({ hideNavBar }) {
  // 전역 공개 설정 준비 여부
  const { ready } = useSiteSettings();

  // 새 브라우저 세션이면(localStorage 잔존) 강제 로그아웃
  useEffect(() => {
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

  // 공개 설정이 로딩되기 전엔 스켈레톤만 보여서 "잠깐 다 보였다가 숨김" 현상 제거
  if (!ready) {
    return (
      <>
        {!hideNavBar && (
          <nav style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#2d4373", padding: "12px 4vw", marginBottom: 24
          }}>
            <div style={{ height: 20, width: 140, background: "#ffffff33", borderRadius: 6 }} />
            <div style={{ height: 20, width: 260, background: "#ffffff33", borderRadius: 6 }} />
          </nav>
        )}
        <div style={{ maxWidth: 520, margin: "40px auto", padding: "0 4vw" }}>
          <div style={{ height: 24, width: 220, background:"#00000010", borderRadius:8, margin:"0 0 10px" }} />
          <div style={{ height: 14, width: 320, background:"#00000008", borderRadius:6 }} />
          <div style={{ height: 120, background:"#00000006", borderRadius:12, marginTop: 18 }} />
        </div>
      </>
    );
  }

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
