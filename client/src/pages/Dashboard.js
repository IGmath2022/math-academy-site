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
import FileUpload from "../components/Admin/FileUpload";
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

  // JWT 파싱 함수
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  }

  // 내 정보 불러오기
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
        // 인증 만료 등은 토큰 삭제 + 새로고침
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setTimeout(() => window.location.reload(), 1200);
        }
      });
  }, []);

  // 블로그 노출 여부
  useEffect(() => {
    fetch(`${API_URL}/api/settings/blog_show`)
      .then(res => res.json())
      .then(data => setShowBlog(data.show));
  }, []);

  // 할당된 강의 불러오기
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

  // 모든 챕터 정보
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

  // 진도 현황 불러오기
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

  // chapterId 기준 진도 map (id/_id 자동 지원)
  const progressMap = {};
  progressList.forEach(p => {
    const id = getChapterId(p.chapterId);
    progressMap[String(id)] = p;
  });

  // 진도 저장 (체크/메모)
  const handleProgressSave = async (chapterId) => {
    const token = localStorage.getItem("token");
    const userId = parseJwt(token)?.id;
    const memo = progressMemo[chapterId] || "";
    const checked = progressMap[chapterId]?.date === today ? true : false;
    try {
      await axios.post(`${API_URL}/api/progress`, {
        userId,
        chapterId,
        memo,
        checked
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

  // ------------------- UI ------------------
  return (
    <div
      className="container"
      style={{
        maxWidth: 480,
        margin: "48px auto",
        padding: "34px 5vw",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 18px #0001",
        minHeight: 350
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 26, fontSize: 23 }}>내 강의 대시보드</h2>
      {error && <p style={{ color: "#e14", textAlign: "center", margin: "8px 0" }}>{error}</p>}

      {myInfo?.schoolId && (
  <div style={{
    marginBottom: 24, borderRadius: 8, background: "#f7fafd", padding: "14px 18px"
  }}>
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

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button
          onClick={() => setViewMode("list")}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: viewMode === "list" ? "#226ad6" : "#eee",
            color: viewMode === "list" ? "#fff" : "#555",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >진도 리스트</button>
        <button
          onClick={() => setViewMode("calendar")}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: viewMode === "calendar" ? "#226ad6" : "#eee",
            color: viewMode === "calendar" ? "#fff" : "#555",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >진도 캘린더</button>
      </div>

      {viewMode === "calendar" ? (
        <StudentProgressCalendar
          progressList={progressList}
          chaptersMap={chaptersMap}
        />
      ) : (
        <ul style={{
          padding: 0,
          listStyle: "none",
          width: "100%",
          margin: 0
        }}>
          {/* 삭제된 강의/단원은 절대 안보임! */}
          {assignments
            .filter(a => a.Chapter && a.Chapter.name)
            .map(a => {
              const chapterId = getChapterId(a.Chapter);
              return (
                <li key={a.id} style={{
                  marginBottom: 18,
                  borderBottom: "1px solid #eee",
                  padding: "12px 0 8px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start"
                }}>
                  <div>
                    <b>{a.Chapter.name}</b>
                    <span style={{ color: "#888", fontSize: 14, marginLeft: 7 }}>
                      {a.Chapter.description}
                    </span>
                    <button
                      style={{
                        marginLeft: 14,
                        padding: "6px 14px",
                        fontSize: 15,
                        borderRadius: 7,
                        border: "none",
                        background: "#226ad6",
                        color: "#fff",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                      onClick={() => setSelected(a.Chapter)}
                    >
                      강의 보기
                    </button>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ fontSize: 15, fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={chapterId && progressMap[chapterId]?.date === today}
                        onChange={e => {
                          setProgressList(prev => {
                            if (!progressMap[chapterId]) return prev;
                            return prev.map(p =>
                              getChapterId(p.chapterId) === chapterId
                                ? { ...p, date: e.target.checked ? today : "" }
                                : p
                            );
                          });
                        }}
                        style={{ marginRight: 7 }}
                      />
                      오늘 진도 완료
                    </label>
                    <input
                      type="text"
                      value={
                        progressMemo[chapterId] ??
                        progressMap[chapterId]?.memo ??
                        ""
                      }
                      onChange={e => setProgressMemo(prev => (
                        chapterId
                          ? { ...prev, [chapterId]: e.target.value }
                          : prev
                      ))}
                      placeholder="메모(선택)"
                      style={{ marginLeft: 12, padding: "5px 8px", borderRadius: 7, border: "1px solid #ccc", minWidth: 130 }}
                    />
                    <button
                      style={{
                        marginLeft: 8,
                        padding: "6px 14px",
                        borderRadius: 7,
                        background: "#eee",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                      onClick={() => handleProgressSave(chapterId)}
                    >
                      저장
                    </button>
                    {progressMap[chapterId]?.date === today && (
                      <span style={{ color: "#227a22", marginLeft: 10, fontWeight: 500, fontSize: 14 }}>
                        오늘 완료
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      )}
      {/* "삭제된 강의까지 모두 제외" */}
      {assignments.filter(a => a.Chapter && a.Chapter.name).length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
          할당된 강의가 없습니다.
        </div>
      )}

      {selected && (
        <div style={{
          marginTop: 34,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          background: "#f9fafd",
          padding: 18
        }}>
          <h4 style={{ fontSize: 17, marginBottom: 15 }}>강의 시청: {selected.name}</h4>
          <iframe
            width="100%"
            height="220"
            src={selected.video_url}
            title={selected.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: 8, background: "#000" }}
          />
        </div>
      )}
      {saveResult && (
        <div style={{ marginTop: 12, color: "#227a22", textAlign: "center", fontWeight: 600 }}>
          {saveResult}
        </div>
      )}
      {showBlog && <Blog limit={3} />}
    </div>
  );
}


// 이하 AdminDashboard, Dashboard (기존과 동일, 수정X)
function AdminDashboard() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  // 업로드 결과를 DB에 저장하거나 알림 등 필요한 로직 (onUploaded)
  const handleFileUploaded = (data) => {
    // 예: 자료실에 등록, 배너 이미지로 사용 등
    // data.url, data.filename 등
    alert("업로드 성공: " + data.url);
    // 여기에 DB저장 API 호출 등 추가
  };

  return (
    <div
      className="container"
      style={{
        maxWidth: 680,
        margin: "48px auto",
        padding: "34px 5vw",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 18px #0001",
        minHeight: 350,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24, fontSize: 22 }}>
        운영자 대시보드{" "}
        <span style={{ color: "#678", fontSize: 15 }}>(관리자용)</span>
      </h2>
       {/* === 예시: 자료실 파일업로드 폼 === */}
       <div style={{ margin: "24px 0" }}>
        <h4 style={{ fontSize: 16 }}>자료실 파일 업로드</h4>
        <FileUpload
          folder="materials"
          academyId="academy123" // 실제 학원별 ID를 props로
          onUploaded={handleFileUploaded}
        />
      </div>

      {/* === 예시: 팝업 배너 이미지 업로드 === */}
      <div style={{ margin: "24px 0" }}>
        <h4 style={{ fontSize: 16 }}>팝업 배너 이미지 업로드</h4>
        <FileUpload
          folder="banner"
          academyId="academy123"
          onUploaded={handleFileUploaded}
        />
      </div>
      <BlogSettingSwitch />
      <PopupBannerAdmin />
      <NewsAdmin />
      <StudentManager />
      <AttendanceManager />
      <ProgressManager />
      <SchoolManager />
      <SchoolPeriodManager />
      <SubjectManager
        onSelectSubject={setSelectedSubject}
        selectedSubject={selectedSubject}
      />
      {selectedSubject && (
        <div
          style={{
            marginTop: 26,
            padding: 18,
            borderRadius: 10,
            background: "#f7f8fa",
            border: "1px solid #e5e5e5",
          }}
        >
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>
            단원/강의 관리:{" "}
            <span style={{ color: "#226ad6" }}>{selectedSubject.name}</span>
          </h3>
          <ChapterManager
            subject={selectedSubject}
            onChapterListChange={setChapterList}
          />
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

  if (loading) return <div style={{
    textAlign: "center",
    marginTop: 80,
    color: "#888",
    fontSize: 18
  }}>로딩 중...</div>;
  if (role === "admin") return <AdminDashboard />;
  if (role === "student") return <StudentDashboard />;
  return <div style={{
    textAlign: "center",
    marginTop: 80,
    color: "#888",
    fontSize: 18
  }}>로그인이 필요합니다.</div>;
}

export default Dashboard;