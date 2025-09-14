import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

const card = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, boxShadow:"0 2px 14px #0001", margin:"18px 0" };
const h3 = { margin:"0 0 14px 0", fontSize:18 };
const ipt = { padding:"10px 12px", borderRadius:10, border:"1px solid #d6d9e4", fontSize:14, width:"100%" };
const btnPrimary = { padding:"10px 14px", borderRadius:10, border:"none", background:"#226ad6", color:"#fff", fontWeight:800, cursor:"pointer" };
const btn = { padding:"8px 12px", borderRadius:10, border:"1px solid #d6d9e4", background:"#fff", cursor:"pointer", fontWeight:700 };
const row = { padding:"10px 0", borderBottom:"1px solid #f2f4fa", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" };

function SubjectManager({ onSelectSubject, selectedSubject }) {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const token = localStorage.getItem("token");

  useEffect(() => { fetchSubjects(); /* eslint-disable-next-line */ }, []);

  const fetchSubjects = async () => {
    const res = await axios.get(`${API_URL}/api/subjects`);
    setSubjects(res.data);
    setPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(
        `${API_URL}/api/subjects/${editingId}`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onSelectSubject && selectedSubject && selectedSubject._id === editingId) {
        onSelectSubject({ ...selectedSubject, name, description });
      }
    } else {
      await axios.post(
        `${API_URL}/api/subjects`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setName(""); setDescription(""); setEditingId(null);
    fetchSubjects();
  };

  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setName(subject.name);
    setDescription(subject.description);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`${API_URL}/api/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchSubjects();
    if (onSelectSubject && selectedSubject?._id === id) onSelectSubject(null);
  };

  const totalPages = Math.ceil(subjects.length / pageSize) || 1;
  const pagedSubjects = subjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={card}>
      <h3 style={h3}>과목 관리</h3>

      <form onSubmit={handleSubmit} style={{ display:"grid", gridTemplateColumns:"1.2fr 2fr auto auto", gap:10, alignItems:"center", marginBottom:12 }}>
        <input placeholder="과목명" value={name} onChange={e=>setName(e.target.value)} required style={ipt}/>
        <input placeholder="설명" value={description} onChange={e=>setDescription(e.target.value)} style={ipt}/>
        <button type="submit" style={btnPrimary}>{editingId ? "수정" : "추가"}</button>
        {editingId && (
          <button type="button" style={btn} onClick={()=>{ setEditingId(null); setName(""); setDescription(""); }}>
            취소
          </button>
        )}
      </form>

      <ul style={{ padding:0, margin:0, listStyle:"none" }}>
        {pagedSubjects.map((s) => (
          <li key={s._id} style={row}>
            <div style={{ minWidth:220, fontWeight:800 }}>{s.name}</div>
            <div style={{ color:"#678", flex:"1 1 auto" }}>{s.description}</div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
              <button style={btn} onClick={()=>handleEdit(s)}>수정</button>
              <button style={{ ...btn, borderColor:"#f2c8cc", color:"#c22", background:"#fff5f6" }} onClick={()=>handleDelete(s._id)}>삭제</button>
              <button style={{ ...btn, color:"#226ad6" }} onClick={()=>onSelectSubject && onSelectSubject(s)}>단원 관리</button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div style={{ textAlign:"center", marginTop:10 }}>
          {Array.from({ length: totalPages }).map((_, i)=>(
            <button key={i+1}
              onClick={()=>setPage(i+1)}
              style={{
                padding:"6px 12px", margin:2, borderRadius:9, border:"1px solid #d6d9e4",
                background: i+1===page ? "#226ad6" : "#fff",
                color: i+1===page ? "#fff" : "#234", fontWeight:800, cursor:"pointer"
              }}>
              {i+1}
            </button>
          ))}
        </div>
      )}

      {subjects.length===0 && (
        <div style={{ color:"#888", textAlign:"center", marginTop:10 }}>등록된 과목이 없습니다.</div>
      )}
    </div>
  );
}

export default SubjectManager;
