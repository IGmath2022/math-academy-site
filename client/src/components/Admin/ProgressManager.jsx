import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

const card = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, boxShadow:"0 2px 14px #0001", margin:"18px 0" };
const h3 = { margin:"0 0 14px 0", fontSize:18 };
const table = { width:"100%", borderCollapse:"collapse" };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #eceff5", fontSize:13, color:"#567" };
const td = { padding:"10px 8px", borderBottom:"1px solid #f2f4fa", fontSize:14 };
const pagerBtn = (active)=>({
  margin:2, padding:"6px 12px", borderRadius:8, border:"1px solid #d6d9e4",
  background: active ? "#226ad6" : "#fff", color: active ? "#fff" : "#234",
  fontWeight:800, cursor:"pointer"
});

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

  const getStudentName = userId =>
    students.find(u => (u._id || u.id) === userId)?.name || userId;
  const getChapterName = chapterId =>
    chapters.find(c => (c._id || c.id) === chapterId)?.name || chapterId;

  const totalPages = Math.ceil(progressList.length / pageSize) || 1;
  const pagedList = progressList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={card}>
      <h3 style={h3}>학생 진도 현황</h3>
      {loading ? (
        <div style={{ color:"#888" }}>불러오는 중...</div>
      ) : (
        <>
          <table style={table}>
            <thead>
              <tr style={{ background:"#f7f9ff" }}>
                <th style={th}>학생</th>
                <th style={th}>단원</th>
                <th style={th}>날짜</th>
                <th style={th}>메모</th>
              </tr>
            </thead>
            <tbody>
              {pagedList.length === 0 ? (
                <tr><td colSpan={4} style={{ ...td, color:"#888", textAlign:"center" }}>기록 없음</td></tr>
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
            <div style={{ marginTop:10, textAlign:"center" }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i+1} onClick={()=>setPage(i+1)} style={pagerBtn(i+1===page)}>
                  {i+1}
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
