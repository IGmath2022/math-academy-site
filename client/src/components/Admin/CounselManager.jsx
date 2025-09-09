import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const today = () => new Date().toISOString().slice(0,10);

export default function CounselManager() {
  const token = useMemo(()=>localStorage.getItem("token"),[]);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ date: today(), memo:"", publicOn:false });

  useEffect(()=>{
    if (!token) return;
    axios.get(`${API_URL}/api/users?role=student&active=true`, { headers:{Authorization:`Bearer ${token}`} })
      .then(r=>setStudents(r.data||[]));
  }, [token]);

  const load = async (sid) => {
    if (!sid) { setList([]); return; }
    const r = await axios.get(`${API_URL}/api/admin/counsel/${sid}`, {
      headers:{Authorization:`Bearer ${token}`}
    });
    setList(r.data||[]);
  };
  useEffect(()=>{ load(studentId); /* eslint-disable-next-line */ }, [studentId]);

  const add = async () => {
    if (!studentId) return;
    await axios.post(`${API_URL}/api/admin/counsel`, {
      ...form, studentId
    }, { headers:{Authorization:`Bearer ${token}`} });
    setForm({ date: today(), memo:"", publicOn:false });
    await load(studentId);
  };
  const del = async (id) => {
    await axios.delete(`${API_URL}/api/admin/counsel/${id}`, {
      headers:{Authorization:`Bearer ${token}`}
    });
    await load(studentId);
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>상담 로그</h3>

      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
        <label>학생</label>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)}>
          <option value="">선택</option>
          {students.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 3fr 1fr 100px", gap:8, marginBottom:10}}>
        <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
        <input placeholder="상담 메모" value={form.memo} onChange={e=>setForm({...form, memo:e.target.value})}/>
        <label><input type="checkbox" checked={form.publicOn} onChange={e=>setForm({...form, publicOn:e.target.checked})}/> 공개</label>
        <button style={btnBlue} onClick={add}>추가</button>
      </div>

      <table style={table}>
        <thead><tr><th style={th}>날짜</th><th style={th}>메모</th><th style={th}>공개</th><th style={th}></th></tr></thead>
        <tbody>
          {list.map(row=>(
            <tr key={row._id}>
              <td style={td}>{row.date}</td>
              <td style={td}>{row.memo}</td>
              <td style={td}>{row.publicOn ? "O" : "-"}</td>
              <td style={td}><button style={btnMini} onClick={()=>del(row._id)}>삭제</button></td>
            </tr>
          ))}
          {list.length===0 && <tr><td colSpan={4} style={{textAlign:"center",padding:12,color:"#888"}}>기록 없음</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const cardStyle = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, margin:"18px 0", boxShadow:"0 2px 14px #0001" };
const titleStyle = { margin:"0 0 14px 0", fontSize:18 };
const btnBlue = { padding:"6px 12px", border:"none", borderRadius:8, background:"#226ad6", color:"#fff", fontWeight:800, cursor:"pointer" };
const btnMini = { padding:"4px 8px", border:"1px solid #d6d9e4", borderRadius:6, background:"#fff", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse" };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #eceff5", fontSize:13, color:"#567" };
const td = { padding:"10px 8px", borderBottom:"1px solid #f2f4fa", fontSize:14 };
