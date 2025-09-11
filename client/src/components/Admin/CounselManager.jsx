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

  // 메시지/로딩 상태
  const [msg, setMsg] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [savingId, setSavingId] = useState("");

  // 행 편집 상태
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({ date:"", memo:"", publicOn:false });

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
    if (!studentId) { setMsg("학생을 선택하세요."); setTimeout(()=>setMsg(""),1200); return; }
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
    // 편집 중 삭제 대비
    if (editId === id) { setEditId(""); }
    await load(studentId);
  };

  // 공개 여부 토글(보기 모드일 때)
  const togglePublic = async (row) => {
    try{
      setTogglingId(row._id);
      await axios.put(`${API_URL}/api/admin/counsel/${row._id}`, {
        publicOn: !row.publicOn
      }, { headers:{Authorization:`Bearer ${token}`} });

      // 낙관적 업데이트
      setList(prev => prev.map(r => r._id===row._id ? { ...r, publicOn: !r.publicOn } : r));
      setMsg(`'${row.date}' 항목이 ${!row.publicOn ? "공개" : "비공개"}로 변경되었습니다.`);
      setTimeout(()=>setMsg(""),1200);
    }catch(e){
      alert("공개 여부 변경 실패");
    }finally{
      setTogglingId("");
      // 최신 반영
      await load(studentId);
    }
  };

  // 편집 시작
  const beginEdit = (row) => {
    setEditId(row._id);
    setEditForm({ date: row.date || today(), memo: row.memo || "", publicOn: !!row.publicOn });
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditId("");
    setEditForm({ date:"", memo:"", publicOn:false });
  };

  // 편집 저장(메모/날짜/공개여부)
  const saveEdit = async (id) => {
    try{
      setSavingId(id);
      await axios.put(`${API_URL}/api/admin/counsel/${id}`, {
        date: editForm.date,
        memo: editForm.memo,
        publicOn: editForm.publicOn
      }, { headers:{Authorization:`Bearer ${token}`} });

      setMsg("수정되었습니다.");
      setTimeout(()=>setMsg(""),1200);
      setEditId("");
      await load(studentId);
    }catch(e){
      alert("수정 실패");
    }finally{
      setSavingId("");
    }
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
        {msg && <span style={{marginLeft:8, color:"#227a22", fontWeight:700}}>{msg}</span>}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 3fr 1fr 100px", gap:8, marginBottom:10}}>
        <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
        <input placeholder="상담 메모" value={form.memo} onChange={e=>setForm({...form, memo:e.target.value})}/>
        <label><input type="checkbox" checked={form.publicOn} onChange={e=>setForm({...form, publicOn:e.target.checked})}/> 공개</label>
        <button style={btnBlue} onClick={add}>추가</button>
      </div>

      <table style={table}>
        <thead>
          <tr>
            <th style={th}>날짜</th>
            <th style={th}>메모</th>
            <th style={th}>공개</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {list.map(row=>(
            <tr key={row._id}>
              {/* 날짜 셀 */}
              <td style={td}>
                {editId === row._id ? (
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e=>setEditForm(prev=>({ ...prev, date:e.target.value }))}
                  />
                ) : (
                  row.date
                )}
              </td>

              {/* 메모 셀 */}
              <td style={td}>
                {editId === row._id ? (
                  <input
                    placeholder="상담 메모"
                    value={editForm.memo}
                    onChange={e=>setEditForm(prev=>({ ...prev, memo:e.target.value }))}
                    style={{width:"100%"}}
                  />
                ) : (
                  row.memo
                )}
              </td>

              {/* 공개 여부 셀 */}
              <td style={td}>
                {editId === row._id ? (
                  <label style={{display:"inline-flex",alignItems:"center",gap:6}}>
                    <input
                      type="checkbox"
                      checked={!!editForm.publicOn}
                      onChange={e=>setEditForm(prev=>({ ...prev, publicOn:e.target.checked }))}
                    />
                    {editForm.publicOn ? "공개" : "비공개"}
                  </label>
                ) : (
                  <label style={{display:"inline-flex",alignItems:"center",gap:6}}>
                    <input
                      type="checkbox"
                      checked={!!row.publicOn}
                      disabled={togglingId===row._id}
                      onChange={()=>togglePublic(row)}
                    />
                    {togglingId===row._id ? "저장 중…" : (row.publicOn ? "공개" : "비공개")}
                  </label>
                )}
              </td>

              {/* 액션 셀 */}
              <td style={td}>
                {editId === row._id ? (
                  <>
                    <button
                      style={btnMini}
                      onClick={()=>saveEdit(row._id)}
                      disabled={savingId===row._id}
                    >
                      {savingId===row._id ? "저장 중…" : "저장"}
                    </button>
                    <button style={btnMini} onClick={cancelEdit}>취소</button>
                  </>
                ) : (
                  <>
                    <button style={btnMini} onClick={()=>beginEdit(row)}>수정</button>
                    <button style={btnMini} onClick={()=>del(row._id)}>삭제</button>
                  </>
                )}
              </td>
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
const btnMini = { marginRight:6, padding:"4px 8px", border:"1px solid #d6d9e4", borderRadius:6, background:"#fff", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse" };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #eceff5", fontSize:13, color:"#567" };
const td = { padding:"10px 8px", borderBottom:"1px solid #f2f4fa", fontSize:14 };
