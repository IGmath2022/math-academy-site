import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

export default function StudentProfilePanel() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [doc, setDoc] = useState({
    school:"", grade:"", targetHigh:"", targetUniv:"",
    roadmap3m:"", roadmap6m:"", roadmap12m:"", publicOn:false
  });
  const [msg, setMsg] = useState("");

  useEffect(()=>{
    if (!token) return;
    axios.get(`${API_URL}/api/users?role=student&active=true`, { headers:{Authorization:`Bearer ${token}`} })
      .then(r=>setStudents(r.data||[]));
  }, [token]);

  const load = async (sid) => {
    if (!sid) { setDoc({school:"",grade:"",targetHigh:"",targetUniv:"",roadmap3m:"",roadmap6m:"",roadmap12m:"", publicOn:false}); return; }
    const r = await axios.get(`${API_URL}/api/admin/profile/${sid}`, { headers:{Authorization:`Bearer ${token}`} });
    setDoc({
      school:r.data?.school||"", grade:r.data?.grade||"",
      targetHigh:r.data?.targetHigh||"", targetUniv:r.data?.targetUniv||"",
      roadmap3m:r.data?.roadmap3m||"", roadmap6m:r.data?.roadmap6m||"", roadmap12m:r.data?.roadmap12m||"",
      publicOn: !!r.data?.publicOn
    });
  };

  useEffect(()=>{ load(studentId); /* eslint-disable-next-line */ }, [studentId]);

  const save = async () => {
    if (!studentId) { setMsg("학생 선택"); return; }
    await axios.post(`${API_URL}/api/admin/profile/${studentId}`, doc, {
      headers:{Authorization:`Bearer ${token}`}
    });
    setMsg("저장됨");
    setTimeout(()=>setMsg(""),1200);
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>학생 프로필 · 로드맵</h3>
      <div style={{display:"flex", gap:10, marginBottom:10}}>
        <label>학생</label>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)}>
          <option value="">선택</option>
          {students.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <label style={{marginLeft:10}}>
          <input type="checkbox" checked={doc.publicOn} onChange={e=>setDoc({...doc, publicOn:e.target.checked})}/>
          공개 리포트에 표시
        </label>
      </div>

      <Grid>
        <Field label="학교/학년"><input value={doc.school} onChange={e=>setDoc({...doc, school:e.target.value})}/></Field>
        <Field label="학년/반(선택)"><input value={doc.grade} onChange={e=>setDoc({...doc, grade:e.target.value})}/></Field>
        <Field label="희망 고등학교"><input value={doc.targetHigh} onChange={e=>setDoc({...doc, targetHigh:e.target.value})}/></Field>
        <Field label="희망 대학교"><input value={doc.targetUniv} onChange={e=>setDoc({...doc, targetUniv:e.target.value})}/></Field>
        <Field label="3개월 목표"><textarea rows={2} value={doc.roadmap3m} onChange={e=>setDoc({...doc, roadmap3m:e.target.value})}/></Field>
        <Field label="6개월 목표"><textarea rows={2} value={doc.roadmap6m} onChange={e=>setDoc({...doc, roadmap6m:e.target.value})}/></Field>
        <Field label="12개월 목표"><textarea rows={2} value={doc.roadmap12m} onChange={e=>setDoc({...doc, roadmap12m:e.target.value})}/></Field>
      </Grid>

      <button onClick={save} style={btnBlue}>저장</button>
      {msg && <span style={{marginLeft:8, color:"#227a22", fontWeight:700}}>{msg}</span>}
    </div>
  );
}

function Grid({children}){ return <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>{children}</div>; }
function Field({label, children}){ return <div><div style={{fontSize:13,color:"#555",marginBottom:6,fontWeight:600}}>{label}</div>{children}</div>; }

const cardStyle = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, margin:"18px 0", boxShadow:"0 2px 14px #0001" };
const titleStyle = { margin:"0 0 14px 0", fontSize:18 };
const btnBlue = { marginTop:10, padding:"6px 12px", border:"none", borderRadius:8, background:"#226ad6", color:"#fff", fontWeight:800, cursor:"pointer" };
