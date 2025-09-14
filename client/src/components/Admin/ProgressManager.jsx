import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const th = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #eef2f7", fontSize: 14, color: "#455" };
const td = { padding: "10px 10px", borderBottom: "1px solid #f3f5fb", fontSize: 14, color: "#223" };

function ProgressManager() {
  const [progressList, setProgressList] = useState([]);
  const [students, setStudents] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [progressRes, userRes, chapterRes] = await Promise.all([
        axios.get(`${API_URL}/api/progress`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users?role=student`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/chapters`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProgressList(progressRes.data);
      setStudents(userRes.data);
      setChapters(chapterRes.data);
      setLoading(false);
      setPage(1);
    }
    fetchAll();
  }, []);

  const getStudentName = (userId) => students.find((u) => (u._id || u.id) === userId)?.name || userId;
  const getChapterName = (chapterId) => chapters.find((c) => (c._id || c.id) === chapterId)?.name || chapterId;

  const totalPages = Math.ceil(progressList.length / pageSize);
  const pagedList = progressList.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <div style={{ color: "#777" }}>불러오는 중…</div>;

  return (
    <div>
      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e8edf6", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7f9ff" }}>
              <th style={th}>학생</th>
              <th style={th}>단원</th>
              <th style={th}>날짜</th>
              <th style={th}>메모</th>
            </tr>
          </thead>
          <tbody>
            {pagedList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...td, color: "#777", textAlign: "center" }}>
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
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid " + (i + 1 === page ? "#226ad6" : "#d8dfeb"),
                background: i + 1 === page ? "#226ad6" : "#fff",
                color: i + 1 === page ? "#fff" : "#223",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default ProgressManager;
