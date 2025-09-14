import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const ipt = { padding: "9px 12px", borderRadius: 10, border: "1px solid #d8dfeb", fontSize: 14 };
const btnPrimary = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#226ad6", color: "#fff", fontWeight: 800, cursor: "pointer" };
const btn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #d8dfeb", background: "#fff", cursor: "pointer", fontWeight: 700 };
const th = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #eef2f7", fontSize: 14, color: "#455" };
const td = { padding: "10px 10px", borderBottom: "1px solid #f3f5fb", fontSize: 14, color: "#223" };

function ChapterManager({ subject, onChapterListChange }) {
  const [chapters, setChapters] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (subject) fetchChapters();
    // eslint-disable-next-line
  }, [subject]);

  const fetchChapters = async () => {
    if (!subject?._id) return;
    const res = await axios.get(`${API_URL}/api/chapters/subject/${subject._id}`);
    setChapters(res.data);
    if (typeof onChapterListChange === "function") onChapterListChange(res.data);
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
    if (editingId) {
      await axios.put(
        `${API_URL}/api/chapters/${editingId}`,
        { name, description, video_url: embedUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        `${API_URL}/api/chapters/subject/${subject._id}`,
        { name, description, video_url: embedUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setName("");
    setDescription("");
    setVideoUrl("");
    setEditingId(null);
    fetchChapters();
  };

  const handleEdit = (chapter) => {
    setEditingId(chapter._id);
    setName(chapter.name);
    setDescription(chapter.description);
    setVideoUrl(chapter.video_url);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`${API_URL}/api/chapters/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchChapters();
  };

  return (
    <div>
      {/* 입력 */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gridTemplateColumns: "200px 1fr 1.3fr auto auto", gap: 10, alignItems: "center", marginBottom: 14 }}
      >
        <input placeholder="단원명" value={name} onChange={(e) => setName(e.target.value)} required style={ipt} />
        <input placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} style={ipt} />
        <input placeholder="유튜브 주소(공유/임베드 모두 OK)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required style={ipt} />
        <button type="submit" style={btnPrimary}>{editingId ? "수정" : "추가"}</button>
        {editingId && (
          <button
            type="button"
            style={btn}
            onClick={() => {
              setEditingId(null);
              setName("");
              setDescription("");
              setVideoUrl("");
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
              <th style={th} width="20%">단원명</th>
              <th style={th}>설명</th>
              <th style={th} width="28%">영상</th>
              <th style={{ ...th, textAlign: "right" }} width="220">액션</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((c) => (
              <tr key={c._id}>
                <td style={td}><b>{c.name}</b></td>
                <td style={{ ...td, color: "#566" }}>{c.description}</td>
                <td style={td}>
                  <a href={c.video_url} target="_blank" rel="noopener noreferrer" style={{ color: "#226ad6", fontWeight: 800, textDecoration: "underline" }}>
                    [강의 미리보기]
                  </a>
                </td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button style={btn} onClick={() => handleEdit(c)}>수정</button>
                  <button style={{ ...btn, marginLeft: 6, borderColor: "#f2caca", background: "#fff5f5", color: "#c22" }} onClick={() => handleDelete(c._id)}>삭제</button>
                </td>
              </tr>
            ))}
            {chapters.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...td, color: "#777", textAlign: "center" }}>등록된 단원이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ChapterManager;
