import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const ipt = { padding: "9px 12px", borderRadius: 10, border: "1px solid #d8dfeb", fontSize: 14 };
const btnPrimary = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#226ad6", color: "#fff", fontWeight: 800, cursor: "pointer" };
const btn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #d8dfeb", background: "#fff", cursor: "pointer", fontWeight: 700 };
const th = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #eef2f7", fontSize: 14, color: "#455" };
const td = { padding: "10px 10px", borderBottom: "1px solid #f3f5fb", fontSize: 14, color: "#223" };

function SubjectManager({ onSelectSubject, selectedSubject }) {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line
  }, []);

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
        const updated = { ...selectedSubject, name, description };
        onSelectSubject(updated);
      }
    } else {
      await axios.post(`${API_URL}/api/subjects`, { name, description }, { headers: { Authorization: `Bearer ${token}` } });
    }
    setName("");
    setDescription("");
    setEditingId(null);
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
    if (onSelectSubject && selectedSubject?._id === id) {
      onSelectSubject(null);
    }
  };

  const totalPages = Math.ceil(subjects.length / pageSize);
  const pagedSubjects = subjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* 입력 영역 */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gridTemplateColumns: "220px 1fr auto auto", gap: 10, alignItems: "center", marginBottom: 14 }}
      >
        <input placeholder="과목명" value={name} onChange={(e) => setName(e.target.value)} required style={ipt} />
        <input placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} style={ipt} />
        <button type="submit" style={btnPrimary}>{editingId ? "수정" : "추가"}</button>
        {editingId && (
          <button
            type="button"
            style={btn}
            onClick={() => {
              setEditingId(null);
              setName("");
              setDescription("");
            }}
          >
            취소
          </button>
        )}
      </form>

      {/* 리스트 테이블 */}
      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e8edf6", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7f9ff" }}>
              <th style={th} width="22%">과목명</th>
              <th style={th}>설명</th>
              <th style={{ ...th, textAlign: "right" }} width="280">액션</th>
            </tr>
          </thead>
          <tbody>
            {pagedSubjects.map((s) => (
              <tr key={s._id}>
                <td style={td}><b>{s.name}</b></td>
                <td style={{ ...td, color: "#566" }}>{s.description}</td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button style={btn} onClick={() => handleEdit(s)}>수정</button>
                  <button style={{ ...btn, marginLeft: 6, borderColor: "#f2caca", background: "#fff5f5", color: "#c22" }} onClick={() => handleDelete(s._id)}>삭제</button>
                  <button style={{ ...btn, marginLeft: 6, background: "#eef6ff", borderColor: "#d2e6ff", color: "#226ad6" }} onClick={() => onSelectSubject && onSelectSubject(s)}>단원 관리</button>
                </td>
              </tr>
            ))}
            {pagedSubjects.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...td, color: "#777", textAlign: "center" }}>등록된 과목이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid " + (i + 1 === page ? "#226ad6" : "#d8dfeb"),
                background: i + 1 === page ? "#226ad6" : "#fff",
                color: i + 1 === page ? "#fff" : "#223",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubjectManager;
