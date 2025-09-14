import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';
import { useNavigate } from "react-router-dom";

// 학생+강의+날짜별 진도 리스트
function ProgressManager() {
  const [progressList, setProgressList] = useState([]);
  const [students, setStudents] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();

  const getAuth = () => {
    const token = localStorage.getItem("token") || "";
    return { headers: { Authorization: `Bearer ${token}` } };
  };
  const handle401 = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setErrMsg("");
      try {
        const auth = getAuth();
        const [progressRes, userRes, chapterRes] = await Promise.all([
          axios.get(`${API_URL}/api/progress`, auth),                 // 관리자: 전체 진도
          axios.get(`${API_URL}/api/users?role=student`, auth),
          axios.get(`${API_URL}/api/chapters`, auth),
        ]);
        setProgressList(progressRes.data || []);
        setStudents(userRes.data || []);
        setChapters(chapterRes.data || []);
        setPage(1);
      } catch (e) {
        if (e?.response?.status === 401) {
          handle401();
          return;
        }
        setErrMsg("진도 데이터를 불러오지 못했습니다.");
        console.error("ProgressManager load error:", e?.response?.data || e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStudentName = (userId) =>
    students.find((u) => (u._id || u.id) === userId)?.name || userId;
  const getChapterName = (chapterId) =>
    chapters.find((c) => (c._id || c.id) === chapterId)?.name || chapterId;

  const totalPages = Math.ceil(progressList.length / pageSize);
  const pagedList = progressList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={wrap}>
      <h3 style={title}>학생 진도 현황</h3>

      {loading && <div style={{ color: "#888" }}>불러오는 중...</div>}
      {!loading && errMsg && (
        <div style={{ color: "#c33", marginBottom: 10, fontWeight: 600 }}>{errMsg}</div>
      )}

      {!loading && !errMsg && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#f3f4f8", fontWeight: 700 }}>
                <td style={th}>학생</td>
                <td style={th}>단원</td>
                <td style={th}>날짜</td>
                <td style={th}>메모</td>
              </tr>
            </thead>
            <tbody>
              {pagedList.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "#888", padding: 12, textAlign: "center" }}>
                    기록 없음
                  </td>
                </tr>
              ) : (
                pagedList.map((p, idx) => (
                  <tr key={p._id || p.id || idx}>
                    <td style={td}>{getStudentName(p.userId)}</td>
                    <td style={td}>{getChapterName(p.chapterId)}</td>
                    <td style={td}>{p.date}</td>
                    <td style={td}>{p.memo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ margin: "13px 0 0 0", textAlign: "center" }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  style={{
                    margin: 2,
                    padding: "6px 13px",
                    borderRadius: 8,
                    border: "none",
                    background: i + 1 === page ? "#226ad6" : "#edf0f6",
                    color: i + 1 === page ? "#fff" : "#445",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const wrap = {
  width: "100%",
  maxWidth: 900,
  margin: "18px auto",
  background: "#fff",
  border: "1px solid #e6e9f2",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 2px 18px #0001",
};
const title = { marginTop: 0, marginBottom: 12, fontSize: 19 };
const th = { padding: 10, border: "1px solid #eef1f6" };
const td = { padding: 10, border: "1px solid #f3f4f8" };

export default ProgressManager;
