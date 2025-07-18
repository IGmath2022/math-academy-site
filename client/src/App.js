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
import FloatingContact from "./components/FloatingContact";
import AttendancePage from './pages/AttendancePage';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route element={<Layout><FloatingContact /></Layout>}>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/news" element={<News />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/attendancePage" element={<AttendancePage />} />
      </Route>
      <Route
          path="/attendancePage"
          element={
            <Layout hideNavBar={true}>
              <AttendancePage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;