import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function AdminNoticeManager() {
  const [news, setNews] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", author: "", file: null });
  const [editId, setEditId] = useState(null);

  // 목록 불러오기
  useEffect(() => {
    axios.get("${API_URL}/api/news").then(r => setNews(r.data));
  }, []);

  // 등록/수정 입력 핸들
  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value
    }));
  };

  // 등록 or 수정
  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const data = new FormData();
    data.append("title", form.title);
    data.append("content", form.content);
    data.append("author", form.author);
    if (form.file) data.append("file", form.file);

    if (editId) {
      await axios.put(`${API_URL}/api/news/${editId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      await axios.post("${API_URL}/api/news", data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    setForm({ title: "", content: "", author: "", file: null });
    setEditId(null);
    // 새로고침
    axios.get("${API_URL}/api/news").then(r => setNews(r.data));
  };

  // 삭제
  const handleDelete = async id => {
    if (!window.confirm("정말 삭제?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/api/news/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    axios.get("${API_URL}/api/news").then(r => setNews(r.data));
  };

  // 수정
  const handleEdit = n => {
    setEditId(n.id);
    setForm({ title: n.title, content: n.content, author: n.author, file: null });
  };

  return (
    <div style={{ maxWidth: 650, margin: "0 auto" }}>
      <h3>공지사항 관리</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="제목" required style={{ marginRight: 7 }} />
        <input name="author" value={form.author} onChange={handleChange} placeholder="작성자" required style={{ marginRight: 7 }} />
        <textarea name="content" value={form.content} onChange={handleChange} placeholder="내용" required style={{ marginRight: 7 }} />
        <input name="file" type="file" onChange={handleChange} accept="image/*,.pdf,.doc,.docx,.hwp" />
        <button type="submit">{editId ? "수정" : "등록"}</button>
      </form>
      <ul>
        {news.map(n => (
          <li key={n.id} style={{ marginBottom: 16 }}>
            <b>{n.title}</b> ({n.author})<br />
            <span style={{ color: "#456" }}>{n.content}</span>
            {n.file &&
              <div>
                <a href={`/uploads/news/${n.file}`} download target="_blank" rel="noopener noreferrer">
                  [첨부파일 다운로드]
                </a>
                {/* 이미지 미리보기(이미지일 때만) */}
                {/\.(jpg|jpeg|png|gif)$/i.test(n.file) &&
                  <img src={`/uploads/news/${n.file}`} style={{ maxWidth: 120, marginTop: 5 }} alt="" />}
              </div>
            }
            <div>
              <button onClick={() => handleEdit(n)}>수정</button>
              <button onClick={() => handleDelete(n.id)}>삭제</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminNoticeManager;