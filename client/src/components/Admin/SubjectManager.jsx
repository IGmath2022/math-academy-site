// client/src/components/Admin/SubjectManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';
import { useNavigate } from "react-router-dom";

function SubjectManager({ onSelectSubject, selectedSubject }) {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();

  const getAuth = () => {
    const token = localStorage.getItem("token") || "";
    return { headers: { Authorization: `Bearer ${token}` } };
  };
  const handle401 = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => { fetchSubjects(); /* eslint-disable-next-line */ }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/subjects`, getAuth());
      setSubjects(res.data || []);
      setPage(1);
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else setSubjects([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/api/subjects/${editingId}`,
          { name, description },
          getAuth()
        );
        if (onSelectSubject && selectedSubject && selectedSubject._id === editingId) {
          onSelectSubject({ ...selectedSubject, name, description });
        }
      } else {
        await axios.post(
          `${API_URL}/api/subjects`,
          { name, description },
          getAuth()
        );
      }
      setName("");
      setDescription("");
      setEditingId(null);
      fetchSubjects();
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else alert("저장 실패");
    }
  };

  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setName(subject.name);
    setDescription(subject.description);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${API_URL}/api/subjects/${id}`, getAuth());
      fetchSubjects();
      if (onSelectSubject && selectedSubject?._id === id) onSelectSubject(null);
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else alert("삭제 실패");
    }
  };

  const totalPages = Math.ceil(subjects.length / pageSize);
  const pagedSubjects = subjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={wrap}>
      <h3 style={title}>과목 관리</h3>

      <form onSubmit={handleSubmit} style={formRow}>
        <label style={col}>
          <span style={label}>과목명</span>
          <input
            placeholder="과목명"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={ipt}
          />
        </label>
        <label style={{ ...col, flex: 2 }}>
          <span style={label}>설명</span>
          <input
            placeholder="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={ipt}
          />
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button type="submit" style={btnPrimary}>{editingId ? "수정" : "추가"}</button>
          {editingId && (
            <button
              type="button"
              style={btnGhost}
              onClick={() => { setEditingId(null); setName(""); setDescription(""); }}
            >
              취소
            </button>
          )}
        </div>
      </form>

      <ul style={{ padding: 0, listStyle: "none", margin: 0, width: "100%" }}>
        {pagedSubjects.map((s) => (
          <li
            key={s._id}
            style={rowItem}
          >
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 16 }}>{s.name}</b>
              <span style={{ color: "#888", marginLeft: 7, fontSize: 14 }}>{s.description}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button style={btnLight} onClick={() => handleEdit(s)}>수정</button>
              <button style={btnDanger} onClick={() => handleDelete(s._id)}>삭제</button>
              <button style={btnLink} onClick={() => onSelectSubject && onSelectSubject(s)}>단원 관리</button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div style={{ margin: "12px 0 0 0", textAlign: "center" }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                margin: 2,
                padding: "6px 13px",
                borderRadius: 8,
                border: "none",
                background: i + 1 === page ? "#226ad6" : "#edf0f6",
                color: i + 1 === page ? "#fff" : "#445",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {subjects.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 18 }}>등록된 과목이 없습니다.</div>
      )}
    </div>
  );
}

const wrap = {
  width: "100%",
  maxWidth: 900,
  margin: "18px auto",
  background: "#fff",
  border: "1px solid #e6e9f2",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 2px 18px #0001",
};
const title = { marginTop: 0, marginBottom: 12, fontSize: 19 };
const formRow = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 14 };
const col = { display: "flex", flexDirection: "column", gap: 6, minWidth: 180, flex: 1 };
const label = { fontSize: 13, color: "#556", fontWeight: 700 };
const ipt = { padding: "10px 12px", borderRadius: 9, border: "1px solid #ccd3e0", fontSize: 15, minWidth: 120 };
const rowItem = { marginBottom: 10, padding: "10px 0", borderBottom: "1px solid #eef1f6", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const btnPrimary = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#226ad6", color: "#fff", fontWeight: 800, cursor: "pointer" };
const btnGhost = { padding: "10px 12px", borderRadius: 9, border: "1px solid #ccd3e0", background: "#fff", color: "#246", fontWeight: 700, cursor: "pointer" };
const btnLight = { padding: "7px 12px", borderRadius: 8, border: "none", background: "#f0f4fa", color: "#226ad6", cursor: "pointer", fontWeight: 600 };
const btnDanger = { padding: "7px 12px", borderRadius: 8, border: "none", background: "#fae5e5", color: "#c22", cursor: "pointer", fontWeight: 600 };
const btnLink = { padding: "7px 12px", borderRadius: 8, border: "none", background: "#e9f3ff", color: "#226ad6", cursor: "pointer", fontWeight: 600 };

export default SubjectManager;
