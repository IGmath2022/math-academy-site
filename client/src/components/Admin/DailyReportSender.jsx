// client/src/components/Admin/DailyReportSender.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const isoDate = (d=new Date()) => d.toISOString().slice(0,10);

export default function DailyReportSender(){
  const [date, setDate] = useState(()=>isoDate());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [msg, setMsg] = useState("");

  const token = useMemo(()=>localStorage.getItem("token")||"",[]);
  const auth  = useMemo(()=>({ headers:{ Authorization:`Bearer ${token}` } }),[token]);

  const call = async (method, url, data) => {
    const res = await axios({ method, url, data, ...auth });
    return res.data;
  };

  const refresh = async ()=>{
    setLoading(true);
    try{
      const data = await call("get", `${API_URL}/api/admin/lessons?date=${date}`);
      setItems(data.items || []);
      setMsg("");
    }catch(e){
      setItems([]);
      setMsg("목록 로드 실패");
    }finally{
      setLoading(false);
    }
  };
  useEffect(()=>{ refresh(); /* eslint-disable-next-line */ },[date]);

  const saveQuick = async (row) => {
    const payload = {
      studentId: row.studentId,
      date,
      course: row.course || "",
      book: row.book || "",
      content: row.content || "",
      homework: row.homework || "",
      feedback: row.feedback || "",
      notifyStatus: "대기",
      scheduledAt: row.scheduledAt || null
    };
    await call("post", `${API_URL}/api/admin/lessons`, payload);
    await refresh();
  };

  const sendOne = async (logId) => {
    setSendingId(logId);
    try{
      await call("post", `${API_URL}/api/admin/lessons/send-one/${logId}`, {});
      await refresh();
    }catch(e){
      alert("발송 실패: " + (e.message||""));
    }finally{
      setSendingId("");
    }
  };

  const sendSelected = async () => {
    const ids = items.filter(x=>x.hasLog && x.notifyStatus!=="발송").map(x=>x.logId).filter(Boolean);
    if(!ids.length){ alert("발송 대상이 없습니다."); return; }
    await call("post", `${API_URL}/api/admin/lessons/send-selected`, { ids });
    await refresh();
  };

  const openReport = (id) => window.open(`/r/${id}`, "_blank");

  return (
    <div style={wrap}>
      <h3 style={{margin:"0 0 12px 0"}}>일일 리포트 발송</h3>

      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={ipt}/>
        <button onClick={refresh} style={btnGhost}>새로고침</button>
        <button onClick={sendSelected} style={btnPrimary}>선택 발송(미발송 전체)</button>
        {msg && <span style={{marginLeft:8,color:"#d33"}}>{msg}</span>}
      </div>

      {loading && <div style={{color:"#888"}}>불러오는 중…</div>}

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f7f8fb"}}>
              <th style={th}>학생</th>
              <th style={th}>등원</th>
              <th style={th}>하원</th>
              <th style={th}>작성</th>
              <th style={th}>상태</th>
              <th style={th}>액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map(row=>(
              <tr key={row.studentId} style={{background: row.missingIn ? "#fff4f4" : "transparent"}}>
                <td style={td}>{row.name}</td>
                <td style={td}>{row.checkIn || "-"}</td>
                <td style={td}>{row.checkOut || "-"}</td>
                <td style={td}>{row.hasLog ? "Y" : "N"}</td>
                <td style={td}>{row.notifyStatus}</td>
                <td style={td}>
                  {row.hasLog ? (
                    <>
                      <button
                        onClick={()=>openReport(row.logId)}
                        style={btnMini}
                      >보기</button>
                      <button
                        onClick={()=>sendOne(row.logId)}
                        disabled={sendingId===row.logId || row.notifyStatus==="발송"}
                        style={{...btnMini, marginLeft:6, background: row.notifyStatus==="발송" ? "#aaa" : "#3cbb2c", color:"#fff", border:"none"}}
                      >
                        {sendingId===row.logId ? "전송중…" : (row.notifyStatus==="발송" ? "발송완료" : "보내기")}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={async ()=>{
                        const course = prompt("과정",""); const book = prompt("교재","");
                        const content = prompt("수업내용(요약)",""); const homework = prompt("과제(줄바꿈 가능)","");
                        const feedback = prompt("개별 피드백(요약)","");
                        await saveQuick({ ...row, course, book, content, homework, feedback });
                      }}
                      style={btnMini}
                    >작성</button>
                  )}
                </td>
              </tr>
            ))}
            {items.length===0 && !loading &&
              <tr><td colSpan={6} style={{padding:12,color:"#888",textAlign:"center"}}>데이터 없음</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const wrap = { border:"1px solid #e5e5e5", background:"#fff", borderRadius:12, padding:16, marginTop:18 };
const ipt = { padding:"6px 10px", borderRadius:8, border:"1px solid #ccc" };
const th  = { textAlign:"left", padding:8, borderBottom:"1px solid #eee" };
const td  = { padding:8, borderBottom:"1px solid #f0f0f0" };
const btnPrimary = { padding:"6px 12px", borderRadius:8, border:"none", background:"#226ad6", color:"#fff", fontWeight:700 };
const btnGhost   = { padding:"6px 12px", borderRadius:8, border:"none", background:"#eee" };
const btnMini    = { padding:"6px 10px", borderRadius:8, border:"1px solid #ccc", background:"#fff", cursor:"pointer" };
