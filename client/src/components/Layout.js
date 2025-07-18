// Layout.js
import React from "react";
import NavBar from "./NavBar";
import FloatingContact from "./FloatingContact"; // 경로 맞게!

function Layout({ children, hideNavBar }) {
  return (
    <>
      {!hideNavBar && <NavBar />}
      <div>{children}</div>
      {!hideNavBar && <FloatingContact />} {/* NavBar와 동일조건 */}
    </>
  );
}

export default Layout;