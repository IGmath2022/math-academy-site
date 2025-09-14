import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

const card = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, boxShadow:"0 2px 14px #0001", margin:"18px 0" };
const h4 = { margin:"0 0 14px 0", fontSize:17 };
const ipt = { padding:"10px 12px", borderRadius:10, border:"1px solid #d6d9e4", fontSize:14, width:"100%" };
const btn = { padding:"8px 12px", borderRadius:10, border:"1px solid #d6d9e4", background:"#fff", cursor:"pointer", fontWeight:700 };

function StudentAssignManager({ chapterList }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchStudents(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (selectedStudent) fetchAssigned(); /* eslint-disable-next-line */ }, [selectedStudent, refresh]);

  const fetchStudents = async () => {
    const res = await axios.get(`${API_URL}/api/users?role=student`, { headers: { Authorization: `Bearer ${token}` } });
    setStudents(res.data.sort((a,b)=>a.name.localeCompare(b.name,'ko')));
  };

  const fetchAssigned = async () => {
    const res = await axios.get(`${API_URL}/api/assignments`, {
      params: { userId: selectedStudent._id },
      headers: { Authorization: `Bearer ${token}` }
    });
    setAssigned(res.data.map(a => String(a.chapterId?._id || a.chapterId)));
  };

  const handleAssign = async (chapterId) => {
    try {
      await axios.post(`${API_URL}/api/assignments`, { userId: selectedStudent._id, chapterId }, { headers: { Authorization: `Bearer ${token}` } });
      setRefresh(r => !r);
    } catch (e) {
      if (e.response?.status === 409) alert("이미 할당된 강의입니다.");
      else alert("할당 오류: " + (e.message || "알 수 없는 오류"));
    }
  };

  const handleUnassign = async (chapterId) => {
    const res = await axios.get(`${API_URL}/api/assignments`, {
      params: { userId: selectedStudent._id },
      headers: { Authorization: `Bearer ${token}` }
    });
    const found = res.data.find(a => String(a.chapterId?._id || a.chapterId) === String(chapterId));
    if (found) {
      await axios.delete(`${API_URL}/api/assignments/${found._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRefresh(r => !r);
    }
  };

  return (
    <div style={card}>
      <h4 style={h4}>학생별 강의 할당</h4>

      <div style={{ marginBottom:12, maxWidth:420 }}>
        <select
          value={selectedStudent?._id || ""}
          onChange={e => {
            const stu = students.find(s => String(s._id) === e.target.value);
            setSelectedStudent(stu || null);
          }}
          style={ipt}
        >
          <option value="">학생 선택</option>
          {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
        </select>
      </div>

      {selectedStudent ? (
        <ul style={{ padding:0, margin:0, listStyle:"none" }}>
          {chapterList.map(c => (
            <li key={c._id}
                style={{ padding:"10px 0", borderBottom:"1px solid #f2f4fa", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ minWidth:220, fontWeight:800 }}>{c.name}</div>
              <div style={{ color:"#678", flex:"1 1 auto" }}>{c.description}</div>
              {assigned.includes(String(c._id)) ? (
                <button
                  style={{ ...btn, borderColor:"#f2c8cc", color:"#c22", background:"#fff5f6", marginLeft:"auto" }}
                  onClick={() => handleUnassign(c._id)}
                >
                  할당 해제
                </button>
              ) : (
                <button
                  style={{ ...btn, color:"#226ad6", marginLeft:"auto" }}
                  onClick={() => handleAssign(c._id)}
                >
                  할당
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color:"#888", marginTop:6 }}>학생을 먼저 선택하세요.</div>
      )}

      {selectedStudent && chapterList.length === 0 && (
        <div style={{ color:"#888", textAlign:"center", marginTop:12 }}>단원이 없습니다.</div>
      )}
    </div>
  );
}

export default StudentAssignManager;
