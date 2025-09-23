// client/src/components/Admin/ChapterManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';
import { useNavigate } from "react-router-dom";

function ChapterManager({ subject, onChapterListChange }) {
  const [chapters, setChapters] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => {
    if (subject) fetchChapters();
    // eslint-disable-next-line
  }, [subject]);

  const fetchChapters = async () => {
    if (!subject?._id) return;
    try {
      const res = await axios.get(`${API_URL}/api/chapters/subject/${subject._id}`, getAuth());
      setChapters(res.data || []);
      if (typeof onChapterListChange === "function") onChapterListChange(res.data || []);
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else setChapters([]);
    }
  };

  function toEmbedUrl(url) {
    const shortMatch = url.match(/^https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/^https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return url;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const embedUrl = toEmbedUrl(videoUrl);
    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/api/chapters/${editingId}`,
          { name, description, video_url: embedUrl },
          getAuth()
        );
      } else {
        await axios.post(
          `${API_URL}/api/chapters/subject/${subject._id}`,
          { name, description, video_url: embedUrl },
          getAuth()
        );
      }
      setName(""); setDescription(""); setVideoUrl(""); setEditingId(null);
      fetchChapters();
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else alert("저장 실패");
    }
  };

  const handleEdit = (chapter) => {
    setEditingId(chapter._id);
    setName(chapter.name);
    setDescription(chapter.description);
    setVideoUrl(chapter.video_url || "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${API_URL}/api/chapters/${id}`, getAuth());
      fetchChapters();
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else alert("삭제 실패");
    }
  };

  return (
    <div style={wrap}>
      <h4 style={title}>단원(강의) 관리 — {subject?.name || "-"}</h4>

      <form onSubmit={handleSubmit} style={formRow}>
        <label style={col}>
          <span style={label}>단원명</span>
          <input placeholder="단원명" value={name} onChange={(e) => setName(e.target.value)} required style={ipt}/>
        </label>
        <label style={{ ...col, flex: 2 }}>
          <span style={label}>설명</span>
          <input placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} style={ipt}/>
        </label>
        <label style={{ ...col, flex: 3, minWidth: 260 }}>
          <span style={label}>유튜브 주소(공유/임베드)</span>
          <input placeholder="https://youtu.be/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required style={ipt}/>
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button type="submit" style={btnPrimary}>{editingId ? "수정" : "추가"}</button>
          {editingId && (
            <button type="button" style={btnGhost} onClick={() => { setEditingId(null); setName(""); setDescription(""); setVideoUrl(""); }}>
              취소
            </button>
          )}
        </div>
      </form>

      <ul style={{ padding: 0, listStyle: "none", margin: 0, width: "100%" }}>
        {chapters.map((c) => (
          <li key={c._id} style={rowItem}>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 16 }}>{c.name}</b>
              <span style={{ color: "#888", marginLeft: 7, fontSize: 14 }}>{c.description}</span>
              {c.video_url && (
                <a href={c.video_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, fontSize: 14, color: "#226ad6", textDecoration: "underline", fontWeight: "bold" }}>
                  [강의 미리보기]
                </a>
              )}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button style={btnLight} onClick={() => handleEdit(c)}>수정</button>
              <button style={btnDanger} onClick={() => handleDelete(c._id)}>삭제</button>
            </div>
          </li>
        ))}
      </ul>

      {chapters.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 14 }}>등록된 단원이 없습니다.</div>
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
const title = { marginTop: 0, marginBottom: 12, fontSize: 18 };
const formRow = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 };
const col = { display: "flex", flexDirection: "column", gap: 6, minWidth: 180, flex: 1 };
const label = { fontSize: 13, color: "#556", fontWeight: 700 };
const ipt = { padding: "10px 12px", borderRadius: 9, border: "1px solid #ccd3e0", fontSize: 15, minWidth: 120 };
const rowItem = { marginBottom: 10, padding: "10px 0", borderBottom: "1px solid #eef1f6", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const btnPrimary = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#226ad6", color: "#fff", fontWeight: 800, cursor: "pointer" };
const btnGhost = { padding: "10px 12px", borderRadius: 9, border: "1px solid #ccd3e0", background: "#fff", color: "#246", fontWeight: 700, cursor: "pointer" };
const btnLight = { padding: "7px 12px", borderRadius: 8, border: "none", background: "#f0f4fa", color: "#226ad6", cursor: "pointer", fontWeight: 600 };
const btnDanger = { padding: "7px 12px", borderRadius: 8, border: "none", background: "#fae5e5", color: "#c22", cursor: "pointer", fontWeight: 600 };

export default ChapterManager;
