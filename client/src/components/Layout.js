import React from "react";
import NavBar from "./NavBar";
import FloatingContact from "./FloatingContact";
import { Outlet } from "react-router-dom";

function Layout({ hideNavBar }) {
  return (
    <>
      {!hideNavBar && <NavBar />}
      <div>
        <Outlet />   {/* 이 부분이 실제 각 Route 페이지가 표시되는 자리! */}
      </div>
      {!hideNavBar && <FloatingContact />}
    </>
  );
}

export default Layout;