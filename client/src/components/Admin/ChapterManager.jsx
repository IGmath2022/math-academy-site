import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

const card = { background:"#fff", border:"1px solid #e5e8f0", borderRadius:14, padding:18, boxShadow:"0 2px 14px #0001", margin:"18px 0" };
const h4 = { margin:"0 0 14px 0", fontSize:17 };
const ipt = { padding:"10px 12px", borderRadius:10, border:"1px solid #d6d9e4", fontSize:14, width:"100%" };
const btnPrimary = { padding:"10px 14px", borderRadius:10, border:"none", background:"#226ad6", color:"#fff", fontWeight:800, cursor:"pointer" };
const btn = { padding:"8px 12px", borderRadius:10, border:"1px solid #d6d9e4", background:"#fff", cursor:"pointer", fontWeight:700 };
const row = { padding:"10px 0", borderBottom:"1px solid #f2f4fa", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" };

function ChapterManager({ subject, onChapterListChange }) {
  const [chapters, setChapters] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => { if (subject) fetchChapters(); /* eslint-disable-next-line */ }, [subject]);

  const fetchChapters = async () => {
    if (!subject?._id) return;
    const res = await axios.get(`${API_URL}/api/chapters/subject/${subject._id}`);
    setChapters(res.data);
    if (typeof onChapterListChange === "function") onChapterListChange(res.data);
  };

  function toEmbedUrl(url) {
    const short = url.match(/^https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (short) return `https://www.youtube.com/embed/${short[1]}`;
    const watch = url.match(/^https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
    return url;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const embedUrl = toEmbedUrl(videoUrl);

    if (editingId) {
      await axios.put(`${API_URL}/api/chapters/${editingId}`, { name, description, video_url: embedUrl }, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post(`${API_URL}/api/chapters/subject/${subject._id}`, { name, description, video_url: embedUrl }, { headers: { Authorization: `Bearer ${token}` } });
    }
    setName(""); setDescription(""); setVideoUrl(""); setEditingId(null);
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
    <div style={card}>
      <h4 style={h4}>단원(강의) 관리 {subject?.name ? `— ${subject.name}` : ""}</h4>

      <form onSubmit={handleSubmit}
        style={{ display:"grid", gridTemplateColumns:"1.2fr 2fr 3fr auto auto", gap:10, alignItems:"center", marginBottom:12 }}>
        <input placeholder="단원명" value={name} onChange={e=>setName(e.target.value)} required style={ipt}/>
        <input placeholder="설명" value={description} onChange={e=>setDescription(e.target.value)} style={ipt}/>
        <input placeholder="유튜브 주소(공유/임베드 모두 가능)" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} required style={ipt}/>
        <button type="submit" style={btnPrimary}>{editingId ? "수정" : "추가"}</button>
        {editingId && (
          <button type="button" style={btn} onClick={()=>{ setEditingId(null); setName(""); setDescription(""); setVideoUrl(""); }}>취소</button>
        )}
      </form>

      <ul style={{ padding:0, margin:0, listStyle:"none" }}>
        {chapters.map((c) => (
          <li key={c._id} style={row}>
            <div style={{ minWidth:200, fontWeight:800 }}>{c.name}</div>
            <div style={{ color:"#678", flex:"1 1 auto" }}>{c.description}</div>
            <a href={c.video_url} target="_blank" rel="noopener noreferrer" style={{ color:"#226ad6", textDecoration:"underline", fontWeight:800 }}>
              [강의 미리보기]
            </a>
            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
              <button style={btn} onClick={()=>handleEdit(c)}>수정</button>
              <button style={{ ...btn, borderColor:"#f2c8cc", color:"#c22", background:"#fff5f6" }} onClick={()=>handleDelete(c._id)}>삭제</button>
            </div>
          </li>
        ))}
      </ul>

      {chapters.length===0 && (
        <div style={{ color:"#888", textAlign:"center", marginTop:10 }}>등록된 단원이 없습니다.</div>
      )}
    </div>
  );
}

export default ChapterManager;
