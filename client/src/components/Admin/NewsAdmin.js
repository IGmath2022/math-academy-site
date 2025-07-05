import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function NewsAdmin() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");
  const author = localStorage.getItem("role") === "admin" ? "운영자" : "";

  const fileInput = useRef(null);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    const res = await axios.get("${API_URL}/api/news");
    setList(res.data);
  };

  // 한글/특수문자 체크 함수
  function hasInvalidChar(file) {
    // 영문,숫자,언더바(_),하이픈(-),점(.)만 허용
    return /[^\w.-]/.test(file.name);
  }

  const handleFileChange = (e) => {
    const fileArr = Array.from(e.target.files);
    for (const file of fileArr) {
      if (hasInvalidChar(file)) {
        alert("※ 파일명에는 한글, 공백, 특수문자가 포함될 수 없습니다.\n영문/숫자/언더바(_)/하이픈(-)/점(.)만 사용하세요.");
        setFiles([]);
        if (fileInput.current) fileInput.current.value = "";
        return;
      }
    }
    setFiles(fileArr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("author", author);
    for (const file of files) {
      formData.append("files", file);
    }
    if (editingId) {
      await axios.put(
        `${API_URL}/api/news/${editingId}`,
        formData,
        { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
    } else {
      await axios.post(
        "${API_URL}/api/news",
        formData,
        { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
    }
    setTitle(""); setContent(""); setFiles([]); setEditingId(null);
    if (fileInput.current) fileInput.current.value = "";
    fetchNews();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setFiles([]); // 기존 첨부파일 유지하려면 별도 구현 필요
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`${API_URL}/api/news/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNews();
  };

  return (
    <div
      style={{
        border: "1px solid #e5e8ec",
        background: "#f8fafd",
        borderRadius: 12,
        padding: "24px 16px",
        marginTop: 30,
        marginBottom: 32,
        boxShadow: "0 2px 6px #0001",
        maxWidth: 440,
        marginLeft: "auto",
        marginRight: "auto"
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, textAlign: "center" }}>
        공지사항 등록/수정 (운영자 전용)
      </h3>
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: 22,
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        {/* 안내문구 */}
        <div style={{ color: "#c22", fontSize: 13, marginBottom: 5 }}>
          ※ 파일명에는 <b>한글, 공백, 특수문자</b> 사용이 불가합니다.<br />
          <b>영문/숫자/언더바(_)/하이픈(-)/점(.)</b>만 허용됩니다.
        </div>
        <input
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{
            width: "100%",
            maxWidth: 350,
            padding: "11px 10px",
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 3
          }}
        />
        <textarea
          placeholder="내용"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          rows={4}
          style={{
            width: "100%",
            maxWidth: 360,
            padding: "11px 10px",
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 3,
            resize: "vertical"
          }}
        />
        <input
          type="file"
          multiple
          ref={fileInput}
          onChange={handleFileChange}
          style={{
            margin: "4px 0 7px 0"
          }}
        />
        <div>
          <button
            type="submit"
            style={{
              padding: "10px 18px",
              fontSize: 15,
              borderRadius: 7,
              border: "none",
              background: "#226ad6",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              marginRight: 8
            }}
          >
            {editingId ? "수정" : "등록"}
          </button>
          {editingId && (
            <button
              type="button"
              style={{
                padding: "10px 16px",
                fontSize: 15,
                borderRadius: 7,
                border: "none",
                background: "#eee",
                color: "#444",
                cursor: "pointer"
              }}
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setContent("");
                setFiles([]);
                if (fileInput.current) fileInput.current.value = "";
              }}
            >
              취소
            </button>
          )}
        </div>
      </form>
      <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
        {list.map(item => (
          <li
            key={item.id}
            style={{
              marginBottom: 28,
              borderBottom: "1px solid #eaeaea",
              paddingBottom: 13
            }}
          >
            <b style={{ fontSize: 16 }}>{item.title}</b>
            <div style={{ color: "#777", fontSize: 13, marginTop: 3 }}>
              {item.author} | {item.createdAt?.slice(0, 10)}
            </div>
            <div
              style={{
                whiteSpace: "pre-line",
                margin: "10px 0 7px 0",
                color: "#444",
                fontSize: 15
              }}
            >
              {item.content}
            </div>
            {item.files && item.files.length > 0 && (
              <div style={{ fontSize: 13, margin: "7px 0 0 0" }}>
                <b>첨부:</b>
                {item.files.map(f =>
                  <span key={f.name}>
                    &nbsp;
                    <a
                      href={`${API_URL}/api/news/download/${encodeURIComponent(f.name)}`}
                      style={{ color: "#226ad6", textDecoration: "underline" }}
                      target="_blank" rel="noopener noreferrer"
                    >
                      {f.originalName}
                    </a>
                  </span>
                )}
              </div>
            )}
            <div>
              <button
                style={{
                  marginRight: 8,
                  padding: "6px 13px",
                  fontSize: 14,
                  borderRadius: 7,
                  border: "none",
                  background: "#f0f4fa",
                  color: "#226ad6",
                  cursor: "pointer",
                  fontWeight: 600
                }}
                onClick={() => handleEdit(item)}
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
                  fontWeight: 600
                }}
                onClick={() => handleDelete(item.id)}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 18 }}>
          등록된 공지사항이 없습니다.
        </div>
      )}
    </div>
  );
}

export default NewsAdmin;