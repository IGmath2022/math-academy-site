import React, { useEffect, useState } from "react";
import axios from "axios";

function SubjectManager({ onSelectSubject, selectedSubject }) {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  // 과목 불러오기
  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line
  }, []);

  const fetchSubjects = async () => {
    const res = await axios.get("http://localhost:4000/api/subjects");
    setSubjects(res.data);
  };

  // 과목 추가/수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(
        `http://localhost:4000/api/subjects/${editingId}`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (
        onSelectSubject &&
        selectedSubject &&
        selectedSubject.id === editingId
      ) {
        const updated = { ...selectedSubject, name, description };
        onSelectSubject(updated);
      }
    } else {
      await axios.post(
        "http://localhost:4000/api/subjects",
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // if (onSelectSubject) onSelectSubject(res.data);
    }
    setName("");
    setDescription("");
    setEditingId(null);
    fetchSubjects();
  };

  // 수정모드 진입
  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setName(subject.name);
    setDescription(subject.description);
  };

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`http://localhost:4000/api/subjects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSubjects();
    if (onSelectSubject && selectedSubject?.id === id) {
      onSelectSubject(null);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e8ec",
        background: "#f8fafd",
        borderRadius: 11,
        padding: "22px 12px",
        marginBottom: 22,
        boxShadow: "0 2px 6px #0001",
        maxWidth: 430,
        margin: "0 auto 28px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 19 }}>과목 관리</h3>
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          placeholder="과목명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            flex: 1,
            minWidth: 80,
            maxWidth: 130,
            padding: "10px 8px",
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <input
          placeholder="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            flex: 2,
            minWidth: 90,
            maxWidth: 170,
            padding: "10px 8px",
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            fontSize: 15,
            borderRadius: 7,
            border: "none",
            background: "#226ad6",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {editingId ? "수정" : "추가"}
        </button>
        {editingId && (
          <button
            type="button"
            style={{
              padding: "10px 13px",
              fontSize: 15,
              borderRadius: 7,
              border: "none",
              background: "#eee",
              color: "#444",
              cursor: "pointer",
              marginLeft: 3,
            }}
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
      <ul style={{ padding: 0, listStyle: "none", margin: 0, width: "100%" }}>
        {subjects.map((s) => (
          <li
            key={s.id}
            style={{
              marginBottom: 12,
              padding: "10px 0",
              borderBottom: "1px solid #eaeaea",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <b style={{ fontSize: 16 }}>{s.name}</b>
            <span style={{ color: "#888", marginLeft: 7, fontSize: 14 }}>
              {s.description}
            </span>
            <button
              style={{
                marginLeft: "auto",
                padding: "6px 13px",
                fontSize: 14,
                borderRadius: 7,
                border: "none",
                background: "#f0f4fa",
                color: "#226ad6",
                cursor: "pointer",
                fontWeight: 600,
                marginRight: 5,
              }}
              onClick={() => handleEdit(s)}
            >
              수정
            </button>
            <button
              style={{
                padding: "6px 10px",
                fontSize: 14,
                borderRadius: 7,
                border: "none",
                background: "#fae5e5",
                color: "#c22",
                cursor: "pointer",
                fontWeight: 600,
                marginRight: 5,
              }}
              onClick={() => handleDelete(s.id)}
            >
              삭제
            </button>
            <button
              style={{
                padding: "6px 12px",
                fontSize: 14,
                borderRadius: 7,
                border: "none",
                background: "#e9f3ff",
                color: "#226ad6",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onClick={() => onSelectSubject && onSelectSubject(s)}
            >
              단원 관리
            </button>
          </li>
        ))}
      </ul>
      {subjects.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 28 }}>
          등록된 과목이 없습니다.
        </div>
      )}
    </div>
  );
}

export default SubjectManager;