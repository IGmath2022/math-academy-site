// client/src/components/Staff/StaffAttendanceTab.jsx
import React, { useState } from "react";
import { getAttendanceOne, setAttendanceTimes } from "../../utils/staffApi";

function todayStr() { return new Date().toISOString().slice(0,10); }

export default function StaffAttendanceTab() {
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [info, setInfo] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const fetch = async () => {
    if (!studentId) { setErr("학생ID를 입력하세요"); setTimeout(()=>setErr(""),1600); return; }
    try {
      const r = await getAttendanceOne({ studentId, date });
      setInfo(r);
      setCheckIn(r.checkIn || "");
      setCheckOut(r.checkOut || "");
    } catch {
      setErr("조회 실패");
      setTimeout(()=>setErr(""),1600);
    }
  };
  const save = async () => {
    if (!studentId) { setErr("학생ID를 입력하세요"); setTimeout(()=>setErr(""),1600); return; }
    try {
      const r = await setAttendanceTimes({ studentId, date, checkIn, checkOut, overwrite:true });
      setMsg(`저장됨: ${r.checkIn || "-"} ~ ${r.checkOut || "-"} / ${r.durationMin ?? ""}분`);
      setTimeout(()=>setMsg(""), 1800);
      fetch();
    } catch {
      setErr("저장 실패");
      setTimeout(()=>setErr(""),1600);
    }
  };

  return (
    <div style={{ border:'1px solid #e5e5e5', borderRadius:12, background:'#fff' }}>
      <div style={{ padding:14, borderBottom:'1px solid #eee', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <label>학생ID</label>
        <input value={studentId} onChange={(e)=>setStudentId(e.target.value)} placeholder="예: 66f..." style={inp} />
        <label>날짜</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        <button onClick={fetch} style={btn}>조회</button>
        <div style={{ marginLeft:'auto' }}>
          <button onClick={save} style={btnPrimary}>저장</button>
        </div>
      </div>
      {msg && <div style={{ padding:12, color:'#227a22' }}>{msg}</div>}
      {err && <div style={{ padding:12, color:'#e14' }}>{err}</div>}
      {!info ? (
        <div style={{ padding:14, color:'#888' }}>학생ID와 날짜를 입력 후 조회하세요.</div>
      ) : (
        <div style={{ padding:14 }}>
          <div style={{ marginBottom:8, color:'#888' }}>source: {info.source}</div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <label>등원</label>
            <input value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} placeholder="HH:mm" style={{...inp, width:120}} />
            <span>~</span>
            <label>하원</label>
            <input value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} placeholder="HH:mm" style={{...inp, width:120}} />
          </div>
          <div style={{ marginTop:10, color:'#666' }}>계산 학습시간(분): {info.studyMin ?? "-"}</div>
        </div>
      )}
    </div>
  );
}
const btn = { padding:'6px 12px', border:'1px solid #ddd', borderRadius:8, background:'#fff', cursor:'pointer' };
const btnPrimary = { padding:'7px 14px', border:'none', borderRadius:8, background:'#226ad6', color:'#fff', fontWeight:700, cursor:'pointer' };
const inp = { padding:'8px 10px', borderRadius:8, border:'1px solid #ccc' };
