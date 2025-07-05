import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from './api';

function ChapterManager({ subject, onChapterListChange }) {
  const [chapters, setChapters] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  // 단원 목록 불러오기
  useEffect(() => {
    if (subject) fetchChapters();
    // eslint-disable-next-line
  }, [subject]);

  const fetchChapters = async () => {
    const res = await axios.get(
      `${API_URL}/api/chapters/subject/${subject.id}`
    );
    setChapters(res.data);
    if (typeof onChapterListChange === "function") onChapterListChange(res.data);
  };

  // 유튜브 주소 변환 함수
  function toEmbedUrl(url) {
    const shortMatch = url.match(/^https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/^https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return url;
  }

  // 단원 추가/수정
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
        `${API_URL}/api/chapters/subject/${subject.id}`,
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

  // 수정모드 진입
  const handleEdit = (chapter) => {
    setEditingId(chapter.id);
    setName(chapter.name);
    setDescription(chapter.description);
    setVideoUrl(chapter.video_url);
  };

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`${API_URL}/api/chapters/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchChapters();
  };

  return (
    <div
      style={{
        border: "1px solid #e5e8ec",
        background: "#f7fafd",
        borderRadius: 11,
        padding: "22px 12px",
        marginTop: 18,
        boxShadow: "0 2px 6px #0001",
        maxWidth: 440,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 22,
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: 18, fontSize: 17 }}>단원(강의) 관리</h4>
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
          placeholder="단원명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            flex: 1,
            minWidth: 90,
            maxWidth: 120,
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
            maxWidth: 150,
            padding: "10px 8px",
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <input
          placeholder="유튜브 주소(공유, 임베드 모두 OK)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
          style={{
            flex: 3,
            minWidth: 120,
            maxWidth: 210,
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
              setVideoUrl("");
            }}
          >
            취소
          </button>
        )}
      </form>
      <ul style={{ padding: 0, listStyle: "none", margin: 0, width: "100%" }}>
        {chapters.map((c) => (
          <li
            key={c.id}
            style={{
              marginBottom: 12,
              padding: "10px 0",
              borderBottom: "1px solid #eaeaea",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <b style={{ fontSize: 16 }}>{c.name}</b>
            <span style={{ color: "#888", marginLeft: 7, fontSize: 14 }}>
              {c.description}
            </span>
            <a
              href={c.video_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: 13,
                fontSize: 14,
                color: "#226ad6",
                textDecoration: "underline",
                fontWeight: "bold",
                marginRight: 7,
              }}
            >
              [강의 미리보기]
            </a>
            <button
              style={{
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
              onClick={() => handleEdit(c)}
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
              onClick={() => handleDelete(c.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      {chapters.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 22 }}>
          등록된 단원이 없습니다.
        </div>
      )}
    </div>
  );
}

export default ChapterManager;