import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../api';

function Materials() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    axios.get(`${API_URL}/api/materials`).then(res => setList(res.data));
  }, [refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("file", file);

    await axios.post(`${API_URL}/api/materials`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`
      }
    });
    setTitle(""); setDescription(""); setFile(null);
    setRefresh(r => !r);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`${API_URL}/api/materials/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRefresh(r => !r);
  };

  return (
    <div
      className="container"
      style={{
        maxWidth: 500,
        margin: "48px auto",
        padding: "36px 4vw",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 18px #0001",
        minHeight: 340,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>자료실</h2>
      {role === "admin" && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 28,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center"
          }}
        >
          <input
            placeholder="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{
              flex: 1,
              minWidth: 110,
              maxWidth: 180,
              padding: "10px 8px",
              fontSize: 15,
              borderRadius: 7,
              border: "1px solid #eee"
            }}
          />
          <input
            placeholder="설명"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              flex: 2,
              minWidth: 120,
              maxWidth: 200,
              padding: "10px 8px",
              fontSize: 15,
              borderRadius: 7,
              border: "1px solid #eee"
            }}
          />
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            required
            style={{
              flex: 1,
              minWidth: 120,
              fontSize: 15
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 22px",
              fontSize: 15,
              borderRadius: 7,
              border: "none",
              background: "#2d4373",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            업로드
          </button>
        </form>
      )}
      <ul style={{
        padding: 0,
        listStyle: "none",
        margin: 0,
        width: "100%"
      }}>
        {list.map(item => (
          <li key={item._id} style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            padding: "16px 0"
          }}>
            <div style={{ flex: 3, minWidth: 160 }}>
              <b>{item.title}</b>
              <span style={{ color: "#888", fontSize: 14, marginLeft: 6 }}>
                {item.description}
              </span>
            </div>
            <a
  href={item.file} // 클라우드 URL 바로 사용
  target="_blank"
  rel="noopener noreferrer"
  style={{
    marginLeft: 16,
    fontSize: 15,
    color: "#226ad6",
    textDecoration: "underline"
  }}
>
  다운로드
</a>
            {role === "admin" && (
              <button
                style={{
                  marginLeft: 10,
                  padding: "6px 12px",
                  fontSize: 14,
                  borderRadius: 6,
                  border: "none",
                  background: "#eee",
                  color: "#444",
                  cursor: "pointer"
                }}
                onClick={() => handleDelete(item._id)}
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
          자료가 없습니다.
        </div>
      )}
    </div>
  );
}

export default Materials;