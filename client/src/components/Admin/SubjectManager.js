import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function SubjectManager({ onSelectSubject, selectedSubject }) {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const token = localStorage.getItem("token");

  // 과목 불러오기
  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line
  }, []);

  const fetchSubjects = async () => {
    const res = await axios.get(`${API_URL}/api/subjects`);
    setSubjects(res.data);
    setPage(1); // 리스트 리셋시 1페이지
  };

  // 과목 추가/수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(
        `${API_URL}/api/subjects/${editingId}`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (
        onSelectSubject &&
        selectedSubject &&
        selectedSubject._id === editingId
      ) {
        const updated = { ...selectedSubject, name, description };
        onSelectSubject(updated);
      }
    } else {
      await axios.post(
        `${API_URL}/api/subjects`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setName("");
    setDescription("");
    setEditingId(null);
    fetchSubjects();
  };

  // 수정모드 진입
  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setName(subject.name);
    setDescription(subject.description);
  };

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`${API_URL}/api/subjects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSubjects();
    if (onSelectSubject && selectedSubject?._id === id) {
      onSelectSubject(null);
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(subjects.length / pageSize);
  const pagedSubjects = subjects.slice((page - 1) * pageSize, page * pageSize);

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
        {pagedSubjects.map((s) => (
          <li
            key={s._id}
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
              onClick={() => handleDelete(s._id)}
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
      {/* 페이지네이션 버튼 */}
      {totalPages > 1 && (
        <div style={{ margin: "12px 0", textAlign: "center" }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                margin: 2,
                padding: "5px 13px",
                borderRadius: 7,
                border: "none",
                background: i + 1 === page ? "#226ad6" : "#eee",
                color: i + 1 === page ? "#fff" : "#444",
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
        <div style={{ color: "#888", textAlign: "center", marginTop: 28 }}>
          등록된 과목이 없습니다.
        </div>
      )}
    </div>
  );
}

export default SubjectManager;