// client/src/components/Staff/StaffCounselTab.jsx
import React, { useEffect, useState } from "react";
import { listCounsel, upsertCounsel, deleteCounsel } from "../../utils/staffApi";

function MonthPicker({ value, onChange }) {
  return <input type="month" value={value} onChange={(e)=>onChange(e.target.value)} style={inp} />;
}

export default function StaffCounselTab() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id:'', date:'', studentId:'', memo:'', publicOn:false });

  const load = async () => {
    try {
      setErr("");
      const r = await listCounsel(month);
      setRows(r);
    } catch {
      setErr("상담 목록 조회 실패");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month]);

  const openNew = () => {
    setForm({ id:'', date:new Date().toISOString().slice(0,10), studentId:'', memo:'', publicOn:false });
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setForm({ id:row.id, date:row.date, studentId:row.studentId, memo:row.memo, publicOn:!!row.publicOn });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      await upsertCounsel(form);
      setMsg("저장되었습니다.");
      setTimeout(()=>setMsg(""), 1600);
      setModalOpen(false);
      await load();
    } catch {
      setErr("저장 실패");
      setTimeout(()=>setErr(""), 1600);
    }
  };
  const remove = async (id) => {
    if (!window.confirm("삭제하시겠어요?")) return;
    try {
      await deleteCounsel(id);
      setMsg("삭제되었습니다.");
      setTimeout(()=>setMsg(""), 1600);
      await load();
    } catch {
      setErr("삭제 실패");
      setTimeout(()=>setErr(""), 1600);
    }
  };

  return (
    <div style={{ border:'1px solid #e5e5e5', borderRadius:12, background:'#fff' }}>
      <div style={{ padding:14, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <h3 style={{ margin:0, fontSize:18 }}>상담</h3>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <button onClick={openNew} style={btnPrimary}>새 상담</button>
      </div>
      {msg && <div style={{ padding:12, color:'#227a22' }}>{msg}</div>}
      {err && <div style={{ padding:12, color:'#e14' }}>{err}</div>}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={th}>날짜</th>
              <th style={th}>학생</th>
              <th style={th}>내용</th>
              <th style={th}>공개</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map(r => (
              <tr key={r.id}>
                <td style={td}>{r.date}</td>
                <td style={td}>{r.student}</td>
                <td style={td}>{r.memo}</td>
                <td style={td}>{r.publicOn ? 'ON' : 'OFF'}</td>
                <td style={tdRight}>
                  <button onClick={()=>openEdit(r)} style={btn}>수정</button>
                  <button onClick={()=>remove(r.id)} style={{...btn, marginLeft:8, color:'#e14', borderColor:'#f1caca'}}>삭제</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td style={{...td, color:'#888'}} colSpan={5}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={modalWrap}>
          <div style={modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <h3 style={{ margin:0, fontSize:18 }}>{form.id ? '상담 수정' : '상담 작성'}</h3>
              <button onClick={()=>setModalOpen(false)} style={btn}>닫기</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="날짜">
                <input type="date" value={form.date} onChange={(e)=>setForm(f=>({...f, date:e.target.value}))} style={inp} />
              </Field>
              <Field label="학생ID">
                <input value={form.studentId} onChange={(e)=>setForm(f=>({...f, studentId:e.target.value}))} placeholder="ObjectId" style={inp} />
              </Field>
              <div style={{ gridColumn:'1 / span 2' }}>
                <label style={lbl}>내용</label>
                <textarea rows={5} value={form.memo} onChange={(e)=>setForm(f=>({...f, memo:e.target.value}))} style={{ ...inp, resize:'vertical' }} />
              </div>
              <Field label="공개">
                <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={!!form.publicOn} onChange={(e)=>setForm(f=>({...f, publicOn:e.target.checked}))} />
                  공개뷰 포함
                </label>
              </Field>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:14 }}>
              <button onClick={save} style={btnPrimary}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

const th = { padding:'10px 8px', borderBottom:'1px solid #eee', textAlign:'left', background:'#f9fafb' };
const td = { padding:'9px 8px', borderBottom:'1px solid #f4f4f4', verticalAlign:'top' };
const tdRight = { ...td, textAlign:'right', whiteSpace:'nowrap' };
const btn = { padding:'6px 12px', border:'1px solid #ddd', borderRadius:8, background:'#fff', cursor:'pointer' };
const btnPrimary = { padding:'7px 14px', border:'none', borderRadius:8, background:'#226ad6', color:'#fff', fontWeight:700, cursor:'pointer' };
const lbl = { display:'block', fontSize:13, color:'#666', marginBottom:6 };
const inp = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #ccc' };
const modalWrap = { position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 };
const modal = { width:'min(800px, 95vw)', background:'#fff', borderRadius:14, padding:16, boxShadow:'0 10px 40px rgba(0,0,0,.25)' };
