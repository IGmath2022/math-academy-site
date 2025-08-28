import StudentProgressCalendar from "../components/Student/StudentProgressCalendar";
import React, { useEffect, useState, useCallback } from "react";
import SubjectManager from "../components/Admin/SubjectManager";
import ChapterManager from "../components/Admin/ChapterManager";
import StudentAssignManager from "../components/Admin/StudentAssignManager";
import axios from "axios";
import NewsAdmin from "../components/Admin/NewsAdmin";
import BlogSettingSwitch from "../components/Admin/BlogSettingSwitch";
import Blog from "./Blog";
import PopupBannerAdmin from "../components/Admin/PopupBannerAdmin";
import ProgressManager from "../components/Admin/ProgressManager";
import SchoolManager from "../components/Admin/SchoolManager";
import StudentManager from "../components/Admin/StudentManager";
import SchoolPeriodManager from "../components/Admin/SchoolPeriodManager";
import AttendanceManager from "../components/Admin/AttendanceManager";
import { API_URL } from '../api';

// ★★★ 모든 챕터ID는 여기서 추출! (id/_id/문자열 커버) ★★★
const getChapterId = chapter => chapter?.id || chapter?._id || chapter;

// 학생 대시보드
function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [showBlog, setShowBlog] = useState(true);
  const [progressList, setProgressList] = useState([]);
  const [progressMemo, setProgressMemo] = useState({});
  const [saveResult, setSaveResult] = useState("");
  const [myInfo, setMyInfo] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [chaptersMap, setChaptersMap] = useState({});

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    axios.get(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMyInfo(res.data))
      .catch(err => {
        setError("사용자 정보를 불러오지 못했습니다. (로그인이 만료됐거나 네트워크 오류)");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setTimeout(() => window.location.reload(), 1200);
        }
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/blog_show`)
      .then(res => res.json())
      .then(data => setShowBlog(data.show));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/api/assignments`, {
        params: { userId: parseJwt(token)?.id },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setAssignments(res.data))
      .catch(() => setError("강의 정보를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API_URL}/api/chapters`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const map = {};
        res.data.forEach(c => { map[getChapterId(c)] = c; });
        setChaptersMap(map);
      });
  }, []);

  const fetchProgress = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const userId = parseJwt(token)?.id;
    axios
      .get(`${API_URL}/api/progress?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setProgressList(res.data));
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const today = new Date().toISOString().slice(0, 10);

  const progressMap = {};
  progressList.forEach(p => {
    const id = getChapterId(p.chapterId);
    progressMap[String(id)] = p;
  });

  const handleProgressSave = async (chapterId) => {
    const token = localStorage.getItem("token");
    const userId = parseJwt(token)?.id;
    const memo = progressMemo[chapterId] || "";
    try {
      await axios.post(`${API_URL}/api/progress`, {
        userId,
        chapterId,
        memo,
        checked: progressMap[chapterId]?.date === today
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveResult("저장되었습니다!");
      fetchProgress();
      setTimeout(() => setSaveResult(""), 1800);
    } catch (e) {
      setSaveResult("저장에 실패했습니다.");
      setTimeout(() => setSaveResult(""), 1800);
      console.error("진도 저장 오류", e?.response?.data || e);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480, margin: "48px auto", padding: "34px 5vw", background: "#fff", borderRadius: 16, boxShadow: "0 2px 18px #0001", minHeight: 350 }}>
      <h2 style={{ textAlign: "center", marginBottom: 26, fontSize: 23 }}>내 강의 대시보드</h2>
      {error && <p style={{ color: "#e14", textAlign: "center", margin: "8px 0" }}>{error}</p>}
      {myInfo?.schoolId && (
        <div style={{ marginBottom: 24, borderRadius: 8, background: "#f7fafd", padding: "14px 18px" }}>
          <b>내 학교: {myInfo.schoolId.name}</b>
          {myInfo.schoolId.SchoolPeriods?.length > 0 && (
            <ul style={{ margin: "8px 0 0 0", padding: 0, fontSize: 15 }}>
              {myInfo.schoolId.SchoolPeriods.map(period => (
                <li key={period._id || period.id}>
                  <b>{period.name}</b>
                  {period.type && <> <span style={{ color: "#666", fontWeight: 400 }}>({period.type})</span></>}
                  : {period.start} ~ {period.end}
                  {period.note && <> - <span style={{ color: "#888" }}>{period.note}</span></>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {assignments.length > 0 ? (
  <div style={{ marginTop: 20 }}>
    <h3 style={{ fontSize: 18, marginBottom: 12 }}>내 수업 영상</h3>
    <ul style={{ listStyle: "none", padding: 0 }}>
      {assignments.map(a => (
        <li key={a._id} style={{ marginBottom: 12, padding: 10, border: "1px solid #eee", borderRadius: 6 }}>
          <b>{a.Chapter?.name || "제목 없음"}</b>
          {a.Chapter?.video_url && (
            <div style={{ marginTop: 8 }}>
              <video width="100%" controls src={a.Chapter.video_url} />
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
) : (
  <p style={{ textAlign: "center", marginTop: 20, color: "#666" }}>할당된 수업 영상이 없습니다.</p>
)}
    
      {/* 이하 진도 리스트/캘린더, 블로그 등 기존 로직 동일 */}
      {showBlog && <Blog limit={3} />}
    </div>
  );
}

function AdminDashboard() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);

  return (
    <div className="container" style={{ maxWidth: 680, margin: "48px auto", padding: "34px 5vw", background: "#fff", borderRadius: 16, boxShadow: "0 2px 18px #0001", minHeight: 350 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, fontSize: 22 }}>
        운영자 대시보드 <span style={{ color: "#678", fontSize: 15 }}>(관리자용)</span>
      </h2>
      <BlogSettingSwitch />
      <PopupBannerAdmin />
      <NewsAdmin />
      <StudentManager />
      <AttendanceManager />
      <ProgressManager />
      <SchoolManager />
      <SchoolPeriodManager />
      <SubjectManager onSelectSubject={setSelectedSubject} selectedSubject={selectedSubject} />
      {selectedSubject && (
        <div style={{ marginTop: 26, padding: 18, borderRadius: 10, background: "#f7f8fa", border: "1px solid #e5e5e5" }}>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>
            단원/강의 관리: <span style={{ color: "#226ad6" }}>{selectedSubject.name}</span>
          </h3>
          <ChapterManager subject={selectedSubject} onChapterListChange={setChapterList} />
          <StudentAssignManager chapterList={chapterList} />
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole || "");
    setLoading(false);
  }, []);

  if (loading) return <div style={{ textAlign: "center", marginTop: 80, color: "#888", fontSize: 18 }}>로딩 중...</div>;
  if (role === "admin") return <AdminDashboard />;
  if (role === "student") return <StudentDashboard />;
  return <div style={{ textAlign: "center", marginTop: 80, color: "#888", fontSize: 18 }}>로그인이 필요합니다.</div>;
}

export default Dashboard;