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

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [targetRow, setTargetRow] = useState(null);
  const openQuick = (row) => { setTargetRow(row); setModalOpen(true); };

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
                      onClick={()=>openQuick(row)}
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

      {/* 팝업 모달 (기존 파일 내 포함) */}
      <QuickReportModal
        open={modalOpen}
        onClose={()=>setModalOpen(false)}
        student={targetRow}
        date={date}
        auth={auth}
        onSaved={refresh}
      />
    </div>
  );
}

/** ===== 모달 컴포넌트 (파일 내부 정의) ===== */
function QuickReportModal({ open, onClose, student, date, auth, onSaved }) {
  const [form, setForm] = useState({
    course:"", book:"", content:"", homework:"", feedback:"",
    tags:"", classType:"", teacher:"", headline:"",
    focus:"", progressPct:"", planNext:""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !student?.studentId) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${API_URL}/api/admin/lessons/detail`,
          { ...auth, params: { studentId: student.studentId, date } }
        );
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
          course:"", book:"", content:"", homework:"", feedback:"",
          tags:"", classType:"", teacher:"", headline:"",
          focus:"", progressPct:"", planNext:""
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, student, date, auth]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!student?.studentId) return;
    setSaving(true);
    try {
      // 예약 시각: “내일 10:30”
      const d = new Date(date + "T10:30:00");
      const tmr = new Date(d.getTime() + 24*60*60*1000);

      const payload = {
        studentId: student.studentId,
        date,
        course: form.course,
        book: form.book,
        content: form.content,
        homework: form.homework,
        feedback: form.feedback,
        tags: form.tags.split(",").map(s=>s.trim()).filter(Boolean),
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
      onSaved?.();
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={backdrop}>
      <div style={modal}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <b style={{fontSize:16}}>리포트 작성 — {student?.name} ({date})</b>
          <button onClick={onClose} style={btnGhost}>닫기</button>
        </div>

        {loading ? (
          <div style={{color:"#666"}}>불러오는 중…</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="과정" value={form.course} onChange={v=>onChange("course",v)} />
            <Field label="교재" value={form.book} onChange={v=>onChange("book",v)} />
            <Area  label="수업내용" value={form.content} onChange={v=>onChange("content",v)} />
            <Area  label="과제" value={form.homework} onChange={v=>onChange("homework",v)} />
            <Area  label="개별 피드백" value={form.feedback} onChange={v=>onChange("feedback",v)} />
            <Field label="태그(쉼표 구분)" value={form.tags} onChange={v=>onChange("tags",v)} />
            <Field label="수업형태" value={form.classType} onChange={v=>onChange("classType",v)} placeholder="개별맞춤수업/판서강의/방학특강 등" />
            <Field label="강사표기" value={form.teacher} onChange={v=>onChange("teacher",v)} />
            <Area  label="핵심 한줄 요약" value={form.headline} onChange={v=>onChange("headline",v)} />
            <Field label="집중도(0~100)" type="number" value={form.focus} onChange={v=>onChange("focus",v)} placeholder="예: 85" />
            <Field label="진행률(%)" type="number" value={form.progressPct} onChange={v=>onChange("progressPct",v)} placeholder="예: 60" />
            <Area  label="다음 수업 계획" value={form.planNext} onChange={v=>onChange("planNext",v)} />
          </div>
        )}

        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
          <button onClick={onClose} style={btnGhost}>취소</button>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "저장 중…" : "저장(예약 대기)"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ===== 모달 내부 공용 입력 컴포넌트 ===== */
function Field({ label, value, onChange, type="text", placeholder="" }) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:6}}>
      <span style={{fontSize:13,color:"#556",fontWeight:700}}>{label}</span>
      <input type={type} value={value} placeholder={placeholder}
             onChange={e=>onChange(e.target.value)} style={ipt}/>
    </label>
  );
}
function Area({ label, value, onChange }) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:6}}>
      <span style={{fontSize:13,color:"#556",fontWeight:700}}>{label}</span>
      <textarea value={value} rows={4}
        onChange={e=>onChange(e.target.value)} style={{...ipt,minHeight:96}} />
    </label>
  );
}

/** ===== 스타일 ===== */
const wrap = { border:"1px solid #e5e5e5", background:"#fff", borderRadius:12, padding:16, marginTop:18 };
const ipt = { padding:"6px 10px", borderRadius:8, border:"1px solid #ccc" };
const th  = { textAlign:"left", padding:8, borderBottom:"1px solid #eee" };
const td  = { padding:8, borderBottom:"1px solid #f0f0f0" };
const btnPrimary = { padding:"6px 12px", borderRadius:8, border:"none", background:"#226ad6", color:"#fff", fontWeight:700 };
const btnGhost   = { padding:"6px 12px", borderRadius:8, border:"none", background:"#eee" };
const btnMini    = { padding:"6px 10px", borderRadius:8, border:"1px solid #ccc", background:"#fff", cursor:"pointer" };

const backdrop = { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 };
const modal    = { width:880, maxWidth:"94vw", maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:12, padding:16, boxShadow:"0 10px 30px rgba(0,0,0,.2)" };
