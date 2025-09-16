// client/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import SuperSiteSettings from "./pages/SuperSiteSettings"; // ✅ 슈퍼 설정 페이지

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* NavBar/FloatingContact 있는 레이아웃 */}
        <Route element={<Layout />}>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<News />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />

          {/* ✅ 슈퍼 설정 라우트 추가 */}
          <Route path="/super-settings" element={<SuperSiteSettings />} />
        </Route>

        {/* NavBar/FloatingContact 없는 레이아웃 */}
        <Route path="/attendancePage" element={<Layout hideNavBar={true} />}>
          <Route index element={<AttendancePage />} />
        </Route>

        {/* 공개 리포트 뷰 */}
        <Route path="/r/:code" element={<Layout hideNavBar={true} />}>
          <Route index element={<ReportPublic />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
