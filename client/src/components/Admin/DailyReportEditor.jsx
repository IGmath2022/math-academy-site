// client/src/components/Admin/DailyReportEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const isoDate = (d=new Date()) => d.toISOString().slice(0,10);
const tomorrow1030 = (baseDateStr) => {
  const d = baseDateStr ? new Date(baseDateStr+"T10:30:00") : new Date();
  d.setDate(d.getDate()+1);
  d.setHours(10,30,0,0);
  return d.toISOString().slice(0,16); // yyyy-MM-ddTHH:mm
};

export default function DailyReportEditor() {
  const [date, setDate] = useState(() => isoDate());
  const [list, setList] = useState([]);          // 이름/출결/작성상태
  const [studentId, setStudentId] = useState(""); // 선택 학생
  const [msg, setMsg] = useState("");

  // 서버 필드명에 맞춘 폼
  const [form, setForm] = useState({
    course: "", book: "", content: "", homework: "", feedback: "",
    tags: "", classType: "", teacher: "",
    durationMin: "", nextPlan: "",
    scheduledAt: tomorrow1030()
  });

  const token = useMemo(()=>localStorage.getItem("token")||"",[]);
  const auth  = useMemo(()=>({ headers:{ Authorization:`Bearer ${token}` } }),[token]);

  // 날짜별 학생 목록(등원 ∪ 작성됨)
  const fetchList = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/admin/lessons`,
        { ...auth, params:{ date } }
      );
      setList(data.items || []);
    } catch {
      setList([]);
      setMsg("목록 조회 실패");
      setTimeout(()=>setMsg(""),1500);
    }
  };
  useEffect(()=>{ if(token){ fetchList(); setStudentId(""); } /* eslint-disable-next-line */ },[date]);

  // 학생 바꿀 때 상세 로드
  useEffect(()=>{
    if(!studentId) return;
    (async ()=>{
      try{
        const { data } = await axios.get(
          `${API_URL}/api/admin/lessons/detail`,
          { ...auth, params:{ studentId, date } }
        );
        setForm({
          course: data?.course || "",
          book: data?.book || "",
          content: data?.content || "",
          homework: data?.homework || "",
          feedback: data?.feedback || "",
          tags: (data?.tags || []).join(", "),
          classType: data?.classType || "",
          teacher: data?.teacher || "",
          durationMin: data?.durationMin ?? "",
          nextPlan: data?.nextPlan || "",
          scheduledAt: data?.scheduledAt
            ? new Date(data.scheduledAt).toISOString().slice(0,16)
            : tomorrow1030(date)
        });
      }catch{
        setForm({
          course:"", book:"", content:"", homework:"", feedback:"",
          tags:"", classType:"", teacher:"",
          durationMin:"", nextPlan:"", scheduledAt:tomorrow1030(date)
        });
      }
    })();
    // eslint-disable-next-line
  },[studentId, date]);

  const onSave = async () => {
    if(!studentId){ setMsg("학생을 선택하세요."); setTimeout(()=>setMsg(""),1200); return; }
    try{
      const payload = {
        studentId, date,
        course: form.course,
        book: form.book,
        content: form.content,
        homework: form.homework,
        feedback: form.feedback,
        tags: form.tags.split(",").map(s=>s.trim()).filter(Boolean),
        classType: form.classType,
        teacher: form.teacher,
        durationMin: form.durationMin === "" ? null : Number(form.durationMin),
        nextPlan: form.nextPlan,
        notifyStatus: "대기",
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : new Date(tomorrow1030(date))
      };
      await axios.post(`${API_URL}/api/admin/lessons`, payload, auth);
      setMsg("저장 완료 (예약: 내일 10:30)");
      setTimeout(()=>setMsg(""),1500);
      await fetchList();
    }catch(e){
      setMsg(e?.response?.data?.message || "저장 실패");
      setTimeout(()=>setMsg(""),1500);
    }
  };

  const studentOptions = useMemo(()=>(
    [...list].sort((a,b)=>a.name.localeCompare(b.name,"ko"))
      .map(it=>({ value: it.studentId, label: `${it.name}${it.hasLog?" (작성됨)":""}` }))
  ),[list]);

  return (
    <div style={wrap}>
      <b style={{fontSize:16}}>데일리 리포트 작성/수정</b>

      <div style={toolbar}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={ipt}/>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)} style={ipt}>
          <option value="">학생 선택</option>
          {studentOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={fetchList} style={btnGhost}>목록 새로고침</button>
      </div>

      <div style={grid2}>
        <Field label="과정" value={form.course} onChange={v=>setForm(f=>({...f,course:v}))}/>
        <Field label="교재" value={form.book} onChange={v=>setForm(f=>({...f,book:v}))}/>
        <Area  label="수업내용" value={form.content} onChange={v=>setForm(f=>({...f,content:v}))}/>
        <Area  label="과제" value={form.homework} onChange={v=>setForm(f=>({...f,homework:v}))}/>
        <Area  label="개별 피드백" value={form.feedback} onChange={v=>setForm(f=>({...f,feedback:v}))}/>
        <Field label="태그(쉼표 구분)" value={form.tags} onChange={v=>setForm(f=>({...f,tags:v}))}/>
        <Field label="수업형태" value={form.classType} onChange={v=>setForm(f=>({...f,classType:v}))} placeholder="개별맞춤수업/판서강의/방학특강 등"/>
        <Field label="강사명" value={form.teacher} onChange={v=>setForm(f=>({...f,teacher:v}))}/>
        <Field label="학습시간(분)" type="number" value={form.durationMin} onChange={v=>setForm(f=>({...f,durationMin:v}))}/>
        <Area  label="다음 수업 계획" value={form.nextPlan} onChange={v=>setForm(f=>({...f,nextPlan:v}))}/>
        <Field label="예약발송" type="datetime-local" value={form.scheduledAt} onChange={v=>setForm(f=>({...f,scheduledAt:v}))}/>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:12,gap:8}}>
        <button onClick={onSave} style={btnPrimary}>저장(예약 대기)</button>
      </div>

      {msg && <div style={{marginTop:8,color:"#226ad6",fontWeight:700}}>{msg}</div>}
    </div>
  );
}

function Field({label,value,onChange,type="text",placeholder=""}){
  return (
    <label style={{display:"flex",flexDirection:"column",gap:6}}>
      <span style={lbl}>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} style={ipt}/>
    </label>
  );
}
function Area({label,value,onChange}){
  return (
    <label style={{display:"flex",flexDirection:"column",gap:6}}>
      <span style={lbl}>{label}</span>
      <textarea rows={4} value={value} onChange={e=>onChange(e.target.value)} style={{...ipt,minHeight:96}}/>
    </label>
  );
}

const wrap = { margin:"12px 0 20px", padding:16, background:"#fff", border:"1px solid #e6e9f2", borderRadius:12 };
const toolbar = { display:"flex", gap:12, marginTop:10, marginBottom:12 };
const grid2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };
const ipt = { padding:"8px 10px", borderRadius:8, border:"1px solid #ccd3e0", fontSize:14 };
const btnPrimary = { padding:"10px 14px", borderRadius:10, border:"none", background:"#226ad6", color:"#fff", fontWeight:800 };
const btnGhost = { padding:"8px 12px", borderRadius:8, border:"1px solid #ccd3e0", background:"#fff", color:"#246", fontWeight:700 };
const lbl = { fontSize:13, color:"#556", fontWeight:700 };
