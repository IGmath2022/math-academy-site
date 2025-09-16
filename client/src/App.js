// client/src/App.js
import React, { Suspense, lazy } from "react";
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

// ⚠️ 문제가 생기면 이 import만 실패시키고 초기 렌더는 살립니다.
const SuperSiteSettings = lazy(() => import("./pages/SuperSiteSettings"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<News />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route
            path="/super-settings"
            element={
              <Suspense fallback={<div style={{padding:20}}>로딩 중…</div>}>
                <SuperSiteSettings />
              </Suspense>
            }
          />
        </Route>

        <Route path="/attendancePage" element={<Layout hideNavBar={true} />}>
          <Route index element={<AttendancePage />} />
        </Route>

        <Route path="/r/:code" element={<Layout hideNavBar={true} />}>
          <Route index element={<ReportPublic />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
