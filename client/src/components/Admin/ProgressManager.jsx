import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';
import { getToken } from "../../utils/auth";

// 학생+강의+날짜별 진도 리스트
function ProgressManager() {
  const [progressList, setProgressList] = useState([]);
  const [students, setStudents] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const token = getToken();
      const [progressRes, userRes, chapterRes] = await Promise.all([
        axios.get(`${API_URL}/api/progress`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users?role=student`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/chapters`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProgressList(progressRes.data);
      setStudents(userRes.data);
      setChapters(chapterRes.data);
      setLoading(false);
      setPage(1); // 데이터 새로고침 시 1페이지
    }
    fetchAll();
  }, []);

  // 학생/단원 이름 매칭 (Mongoose는 ._id)
  const getStudentName = userId =>
    students.find(u => (u._id || u.id) === userId)?.name || userId;
  const getChapterName = chapterId =>
    chapters.find(c => (c._id || c.id) === chapterId)?.name || chapterId;

  // 페이지네이션 계산
  const totalPages = Math.ceil(progressList.length / pageSize);
  const pagedList = progressList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      style={{
        border: "1px solid #e5e8ec",
        background: "#f9fafb",
        borderRadius: 13,
        padding: "28px 12px",
        marginBottom: 30,
        boxShadow: "0 2px 8px #0001",
        maxWidth: 600,
        margin: "0 auto 30px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 19 }}>학생 진도 현황</h3>
      {loading ? (
        <div style={{ color: "#888" }}>불러오는 중...</div>
      ) : (
        <>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f8", fontWeight: 600 }}>
              <td style={{ padding: 8, border: "1px solid #eee" }}>학생</td>
              <td style={{ padding: 8, border: "1px solid #eee" }}>단원</td>
              <td style={{ padding: 8, border: "1px solid #eee" }}>날짜</td>
              <td style={{ padding: 8, border: "1px solid #eee" }}>메모</td>
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
                  <td style={{ padding: 7, border: "1px solid #f1f1f1" }}>
                    {getStudentName(p.userId)}
                  </td>
                  <td style={{ padding: 7, border: "1px solid #f1f1f1" }}>
                    {getChapterName(p.chapterId)}
                  </td>
                  <td style={{ padding: 7, border: "1px solid #f1f1f1" }}>
                    {p.date}
                  </td>
                  <td style={{ padding: 7, border: "1px solid #f1f1f1" }}>
                    {p.memo}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* 페이지네이션 버튼 */}
        {totalPages > 1 && (
          <div style={{ margin: "13px 0 0 0", textAlign: "center" }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                style={{
                  margin: 2,
                  padding: "5px 13px",
                  borderRadius: 7,
                  border: "none",
                  background: i + 1 === page ? "#226ad6" : "#eee",
                  color: i + 1 === page ? "#fff" : "#444",
                  fontWeight: 700,
                  cursor: "pointer"
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
export default ProgressManager;
