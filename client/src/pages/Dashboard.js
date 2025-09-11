import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../api";
import Blog from "./Blog";

// Student
import StudentProgressCalendar from "../components/Student/StudentProgressCalendar";

// Admin (탭 래퍼)
import AdminDashboardTabs from "../components/Admin/AdminDashboardTabs";

// ★★★ 모든 챕터ID는 여기서 추출! (id/_id/문자열 커버) ★★★
const getChapterId = (chapter) => chapter?.id || chapter?._id || chapter;

/** =========================
 *  학생 대시보드 (기존 유지)
 *  ========================= */
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

  // JWT 파싱
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  }

  // 내 정보
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    axios
      .get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMyInfo(res.data))
      .catch((err) => {
        setError(
          "사용자 정보를 불러오지 못했습니다. (로그인이 만료됐거나 네트워크 오류)"
        );
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
      .then((res) => res.json())
      .then((data) => setShowBlog(data.show));
  }, []);

  // 할당 강의
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/api/assignments`, {
        params: { userId: parseJwt(token)?.id },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAssignments(res.data))
      .catch(() => setError("강의 정보를 불러오지 못했습니다."));
  }, []);

  // 모든 챕터
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/api/chapters`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const map = {};
        res.data.forEach((c) => {
          map[getChapterId(c)] = c;
        });
        setChaptersMap(map);
      });
  }, []);

  // 진도 현황
  const fetchProgress = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const userId = parseJwt(token)?.id;
    axios
      .get(`${API_URL}/api/progress?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProgressList(res.data));
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const today = new Date().toISOString().slice(0, 10);

  // chapterId 기준 진도 map
  const progressMap = {};
  progressList.forEach((p) => {
    const id = getChapterId(p.chapterId);
    progressMap[String(id)] = p;
  });

  // 진도 저장
  const handleProgressSave = async (chapterId) => {
    const token = localStorage.getItem("token");
    const userId = (() => {
      try {
        return JSON.parse(atob(token.split(".")[1]))?.id;
      } catch {
        return "";
      }
    })();
    const memo = progressMemo[chapterId] || "";
    const checked = progressMap[chapterId]?.date === today ? true : false;
    try {
      await axios.post(
        `${API_URL}/api/progress`,
        {
          userId,
          chapterId,
          memo,
          checked,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
        minHeight: 350,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 26, fontSize: 23 }}>
        내 강의 대시보드
      </h2>
      {error && (
        <p style={{ color: "#e14", textAlign: "center", margin: "8px 0" }}>
          {error}
        </p>
      )}

      {myInfo?.schoolId && (
        <div
          style={{
            marginBottom: 24,
            borderRadius: 8,
            background: "#f7fafd",
            padding: "14px 18px",
          }}
        >
          <b>내 학교: {myInfo.schoolId.name}</b>
          {myInfo.schoolId.SchoolPeriods?.length > 0 && (
            <ul style={{ margin: "8px 0 0 0", padding: 0, fontSize: 15 }}>
              {myInfo.schoolId.SchoolPeriods.map((period) => (
                <li key={period._id || period.id}>
                  <b>{period.name}</b>
                  {period.type && (
                    <>
                      {" "}
                      <span style={{ color: "#666", fontWeight: 400 }}>
                        ({period.type})
                      </span>
                    </>
                  )}
                  : {period.start} ~ {period.end}
                  {period.note && (
                    <>
                      {" "}
                      - <span style={{ color: "#888" }}>{period.note}</span>
                    </>
                  )}
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
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          진도 리스트
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: viewMode === "calendar" ? "#226ad6" : "#eee",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          진도 캘린더
        </button>
      </div>

      {viewMode === "calendar" ? (
        <StudentProgressCalendar
          progressList={progressList}
          chaptersMap={chaptersMap}
        />
      ) : (
        <ul
          style={{
            padding: 0,
            listStyle: "none",
            width: "100%",
            margin: 0,
          }}
        >
          {/* 삭제된 강의/단원은 절대 안보임! */}
          {assignments
            .filter((a) => a.Chapter && a.Chapter.name)
            .map((a) => {
              const chapterId = getChapterId(a.Chapter);
              return (
                <li
                  key={a.id}
                  style={{
                    marginBottom: 18,
                    borderBottom: "1px solid #eee",
                    padding: "12px 0 8px 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <b>{a.Chapter.name}</b>
                    <span
                      style={{ color: "#888", fontSize: 14, marginLeft: 7 }}
                    >
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
                        cursor: "pointer",
                      }}
                      onClick={() => setSelected(a.Chapter)}
                    >
                      강의 보기
                    </button>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <label style={{ fontSize: 15, fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={
                          chapterId && progressMap[chapterId]?.date === today
                        }
                        onChange={(e) => {
                          setProgressList((prev) => {
                            if (!progressMap[chapterId]) return prev;
                            return prev.map((p) =>
                              getChapterId(p.chapterId) === chapterId
                                ? {
                                    ...p,
                                    date: e.target.checked ? today : "",
                                  }
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
                      onChange={(e) =>
                        setProgressMemo((prev) =>
                          chapterId
                            ? { ...prev, [chapterId]: e.target.value }
                            : prev
                        )
                      }
                      placeholder="메모(선택)"
                      style={{
                        marginLeft: 12,
                        padding: "5px 8px",
                        borderRadius: 7,
                        border: "1px solid #ccc",
                        minWidth: 130,
                      }}
                    />
                    <button
                      style={{
                        marginLeft: 8,
                        padding: "6px 14px",
                        borderRadius: 7,
                        background: "#eee",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => handleProgressSave(chapterId)}
                    >
                      저장
                    </button>
                    {progressMap[chapterId]?.date === today && (
                      <span
                        style={{
                          color: "#227a22",
                          marginLeft: 10,
                          fontWeight: 500,
                          fontSize: 14,
                        }}
                      >
                        오늘 완료
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      )}
      {/* "삭제된 강의까지 모두 제외" */}
      {assignments.filter((a) => a.Chapter && a.Chapter.name).length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
          할당된 강의가 없습니다.
        </div>
      )}

      {selected && (
        <div
          style={{
            marginTop: 34,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#f9fafd",
            padding: 18,
          }}
        >
          <h4 style={{ fontSize: 17, marginBottom: 15 }}>
            강의 시청: {selected.name}
          </h4>
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
        <div
          style={{
            marginTop: 12,
            color: "#227a22",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {saveResult}
        </div>
      )}
      {showBlog && <Blog limit={3} />}
    </div>
  );
}

/** =========================
 *  라우팅 진입점
 *  ========================= */
function Dashboard() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole || "");
    setLoading(false);
  }, []);

  if (loading)
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: 80,
          color: "#888",
          fontSize: 18,
        }}
      >
        로딩 중...
      </div>
    );
  if (role === "admin") return <AdminDashboardTabs />;
  if (role === "student") return <StudentDashboard />;
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: 80,
        color: "#888",
        fontSize: 18,
      }}
    >
      로그인이 필요합니다.
    </div>
  );
}

export default Dashboard;
