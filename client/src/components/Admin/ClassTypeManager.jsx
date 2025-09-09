import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

export default function ClassTypeManager() {
  const token = useMemo(()=>localStorage.getItem("token"),[]);
  const [list, setList] = useState([]);
  const [name, setName] = useState("");

  const load = async () => {
    const r = await axios.get(`${API_URL}/api/admin/class-types`, {
      headers:{Authorization:`Bearer ${token}`}
    });
    setList(r.data||[]);
  };
  useEffect(()=>{ if(token) load(); /* eslint-disable-next-line */ }, [token]);

  const add = async () => {
    if (!name.trim()) return;
    await axios.post(`${API_URL}/api/admin/class-types`, { name, active:true }, {
      headers:{Authorization:`Bearer ${token}`}
    });
    setName("");
    await load();
  };
  const toggle = async (row) => {
    await axios.put(`${API_URL}/api/admin/class-types/${row._id}`, { name:row.name, active:!row.active }, {
      headers:{Authorization:`Bearer ${token}`}
    });
    await load();
  };
  const del = async (id) => {
    await axios.delete(`${API_URL}/api/admin/class-types/${id}`, { headers:{Authorization:`Bearer ${token}`} });
    await load();
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>수업형태 관리</h3>
      <div style={{display:"flex",gap:8, marginBottom:10}}>
        <input placeholder="형태명(예: 개별맞춤수업)" value={name} onChange={e=>setName(e.target.value)}/>
        <button style={btnBlue} onClick={add}>추가</button>
      </div>
      <table style={table}>
        <thead><tr><th style={th}>이름</th><th style={th}>상태</th><th style={th}></th></tr></thead>
        <tbody>
          {list.map(row=>(
            <tr key={row._id}>
              <td style={td}>{row.name}</td>
              <td style={td}>{row.active ? "활성" : "중지"}</td>
              <td style={td}>
                <button style={btnMini} onClick={()=>toggle(row)}>{row.active?"중지":"활성"}</button>
                <button style={btnMini} onClick={()=>del(row._id)}>&nbsp;삭제&nbsp;</button>
              </td>
            </tr>
          ))}
          {list.length===0 && <tr><td colSpan={3} style={{padding:12,textAlign:"center",color:"#888"}}>등록 없음</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const cardStyle = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, margin:"18px 0", boxShadow:"0 2px 14px #0001" };
const titleStyle = { margin:"0 0 14px 0", fontSize:18 };
const btnBlue = { padding:"6px 12px", border:"none", borderRadius:8, background:"#226ad6", color:"#fff", fontWeight:800, cursor:"pointer" };
const btnMini = { marginLeft:6, padding:"4px 8px", border:"1px solid #d6d9e4", borderRadius:6, background:"#fff", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse" };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #eceff5", fontSize:13, color:"#567" };
const td = { padding:"10px 8px", borderBottom:"1px solid #f2f4fa", fontSize:14 };
