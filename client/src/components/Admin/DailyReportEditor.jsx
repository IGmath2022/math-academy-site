// client/src/components/Admin/DailyReportEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

export default function DailyReportEditor() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [list, setList] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState({
    course: "", book: "", content: "", homework: "", feedback: "",
    tags: "", classType: "", teacher: "", headline: "",
    focus: "", progressPct: "", planNext: ""
  });
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const fetchList = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/lessons/by-date`, { ...auth, params: { date } });
      setList(data.items || []);
    } catch {
      setMsg("목록 조회 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  useEffect(() => { if (token) { fetchList(); setStudentId(""); } /* eslint-disable-next-line */ }, [date]);

  // 학생 변경 시 해당일 로그 로드
  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const { data } = await axios.get(`${API_URL}/api/admin/lessons/detail`, { ...auth, params: { studentId, date } });
        setForm({
          course: data?.course || "",
          book: data?.book || "",
          content: data?.content || "",
          homework: data?.homework || "",
          feedback: data?.feedback || "",
          tags: (data?.tags || []).join(", "),
          classType: data?.classType || "",
          teacher: data?.teacher || data?.teacherName || "",
          headline: data?.headline || "",
          focus: data?.focus ?? "",
          progressPct: data?.progressPct ?? "",
          planNext: data?.planNext || data?.nextPlan || ""
        });
      } catch {
        setForm({
          course: "", book: "", content: "", homework: "", feedback: "",
          tags: "", classType: "", teacher: "", headline: "",
          focus: "", progressPct: "", planNext: ""
        });
      }
    };
    load();
    // eslint-disable-next-line
  }, [studentId, date]);

  const handleSave = async () => {
    if (!studentId) { setMsg("학생을 선택하세요."); setTimeout(() => setMsg(""), 1200); return; }
    try {
      // 기본 예약시각: 내일 10:30 KST
      const d = new Date(date + "T10:30:00");
      const tmr = new Date(d.getTime() + 24*60*60*1000);

      const payload = {
        studentId,
        date,
        course: form.course,
        book: form.book,
        content: form.content,
        homework: form.homework,
        feedback: form.feedback,
        tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
        classType: form.classType,
        teacher: form.teacher,
        headline: form.headline,
        focus: form.focus === "" ? undefined : Number(form.focus),
        progressPct: form.progressPct === "" ? undefined : Number(form.progressPct),
        planNext: form.planNext,
        notifyStatus: "대기",
        scheduledAt: tmr
      };

      await axios.post(`${API_URL}/api/admin/lessons`, payload, auth);
      setMsg("저장 완료 (예약: 내일 10:30)");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg(e?.response?.data?.message || "저장 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  const studentOptions = useMemo(() => {
    const arr = [...list].sort((a,b) => a.name.localeCompare(b.name, 'ko'));
    return arr.map(it => ({ value: it.studentId, label: `${it.name}${it.hasLog ? " (작성됨)" : ""}` }));
  }, [list]);

  return (
    <div style={{ margin: "12px 0 20px", padding: 16, background: "#fff", border: "1px solid #e6e9f2", borderRadius: 12 }}>
      <b style={{ fontSize: 16 }}>데일리 리포트 작성/수정</b>
      <div style={{ display:"flex", gap:12, marginTop:10, marginBottom:12 }}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={ipt}/>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)} style={ipt}>
          <option value="">학생 선택</option>
          {studentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={fetchList} style={btnGhost}>목록 새로고침</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="과정"    value={form.course}     onChange={v=>setForm(f=>({...f,course:v}))}/>
        <Field label="교재"    value={form.book}       onChange={v=>setForm(f=>({...f,book:v}))}/>
        <Area  label="수업내용" value={form.content}    onChange={v=>setForm(f=>({...f,content:v}))}/>
        <Area  label="과제"    value={form.homework}   onChange={v=>setForm(f=>({...f,homework:v}))}/>
        <Area  label="개별 피드백" value={form.feedback} onChange={v=>setForm(f=>({...f,feedback:v}))}/>
        <Field label="태그(쉼표 구분)" value={form.tags} onChange={v=>setForm(f=>({...f,tags:v}))}/>
        <Field label="수업형태" value={form.classType} onChange={v=>setForm(f=>({...f,classType:v}))} placeholder="개별맞춤수업/판서강의/방학특강 등"/>
        <Field label="강사표기" value={form.teacher} onChange={v=>setForm(f=>({...f,teacher:v}))}/>
        <Area  label="핵심 한줄 요약" value={form.headline} onChange={v=>setForm(f=>({...f,headline:v}))}/>
        <Field label="집중도(0~100)" type="number" value={form.focus}
               onChange={v=>setForm(f=>({...f,focus:v}))} placeholder="예: 85"/>
        <Field label="진행률(%)" type="number" value={form.progressPct}
               onChange={v=>setForm(f=>({...f,progressPct:v}))} placeholder="예: 60"/>
        <Area  label="다음 수업 계획" value={form.planNext} onChange={v=>setForm(f=>({...f,planNext:v}))}/>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
        <button onClick={handleSave} style={btnPrimary}>저장(예약 대기)</button>
      </div>
      {msg && <div style={{ marginTop:8, color:"#226ad6", fontWeight:700 }}>{msg}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type="text", placeholder="" }) {
  return (
    <label style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <span style={{ fontSize:13, color:"#556", fontWeight:700 }}>{label}</span>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)}
        style={ipt}/>
    </label>
  );
}
function Area({ label, value, onChange }) {
  return (
    <label style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <span style={{ fontSize:13, color:"#556", fontWeight:700 }}>{label}</span>
      <textarea value={value} rows={4}
        onChange={e=>onChange(e.target.value)}
        style={{...ipt, minHeight:96}}/>
    </label>
  );
}

const ipt = { padding:"8px 10px", borderRadius:8, border:"1px solid #ccd3e0", fontSize:14 };
const btnPrimary = { padding:"10px 14px", borderRadius:10, border:"none", background:"#226ad6", color:"#fff", fontWeight:800 };
const btnGhost = { padding:"8px 12px", borderRadius:8, border:"1px solid #ccd3e0", background:"#fff", color:"#246", fontWeight:700 };
