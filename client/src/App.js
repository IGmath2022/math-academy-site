// client/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Main from "./pages/Main";
import News from "./pages/News";
import Layout from "./components/Layout";
import Materials from "./pages/Materials";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import AttendancePage from "./pages/AttendancePage";
import ReportPublic from "./pages/ReportPublic";

// 슈퍼 설정 페이지 (통합본) + 레거시 경로 호환용 래퍼
import SuperSettings from "./pages/SuperSettings";
import SuperSiteSettings from "./pages/SuperSiteSettings";

function App() {
  return (
    <SiteSettingsProvider>
      <BrowserRouter>
        <Routes>
          {/* NavBar/FloatingContact 있는 Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Main />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />

            {/* 슈퍼 관리자 설정 (신규 표준 경로) */}
            <Route path="/super-settings" element={<SuperSettings />} />
            {/* 레거시 호환 경로: 기존 링크가 있을 수 있어 유지 */}
            <Route path="/super-site-settings" element={<SuperSiteSettings />} />
          </Route>

          {/* NavBar/FloatingContact 없는 Layout */}
          <Route path="/attendancePage" element={<Layout hideNavBar={true} />}>
            <Route index element={<AttendancePage />} />
          </Route>

          {/* 공개 리포트 뷰 */}
          <Route path="/r/:code" element={<Layout hideNavBar={true} />}>
            <Route index element={<ReportPublic />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SiteSettingsProvider>
  );
}

export default App;
