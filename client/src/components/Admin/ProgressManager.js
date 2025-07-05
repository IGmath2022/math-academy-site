import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

// 학생+강의+날짜별 진도 리스트

function ProgressManager() {
    const [progressList, setProgressList] = useState([]);
    const [students, setStudents] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      async function fetchAll() {
        setLoading(true);
        const token = localStorage.getItem("token");
        const [progressRes, userRes, chapterRes] = await Promise.all([
          axios.get(`${API_URL}/api//progress`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api//users?role=student`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api//chapters`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setProgressList(progressRes.data);
        setStudents(userRes.data);
        setChapters(chapterRes.data);
        setLoading(false);
      }
      fetchAll();
    }, []);
  
    // 학생/단원 이름 매칭
    const getStudentName = userId =>
      students.find(u => u.id === userId)?.name || userId;
    const getChapterName = chapterId =>
      chapters.find(c => c.id === chapterId)?.name || chapterId;
  
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
              {progressList.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "#888", padding: 12, textAlign: "center" }}>
                    기록 없음
                  </td>
                </tr>
              ) : (
                progressList.map((p, idx) => (
                  <tr key={idx}>
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
        )}
      </div>
    );
  }
export default ProgressManager;