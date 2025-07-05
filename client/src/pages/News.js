import React, { useEffect, useState } from "react";
import axios from "axios";
import Blog from "./Blog";

function News() {
  const [list, setList] = useState([]);
  const [showBlog, setShowBlog] = useState(true);

  useEffect(() => {
    fetch("/api/settings/blog_show")
      .then(res => res.json())
      .then(data => setShowBlog(data.show));
  }, []);

  useEffect(() => {
    axios.get("/api/news").then(res => setList(res.data));
  }, []);

  return (
    <div
      className="container"
      style={{
        maxWidth: 520,
        margin: "48px auto",
        padding: "38px 5vw",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 18px #0001",
        minHeight: 320
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>공지사항</h2>
      <ul style={{
        padding: 0,
        listStyle: "none",
        margin: 0,
        width: "100%"
      }}>
        {list.map(item => (
          <li key={item.id}
            style={{
              marginBottom: 32,
              borderBottom: "1px solid #eee",
              paddingBottom: 18
            }}>
            <b style={{ fontSize: 17 }}>{item.title}</b>
            <div style={{
              color: "#678",
              fontSize: 13,
              margin: "6px 0 2px 1px",
              letterSpacing: "0.02em"
            }}>
              {item.author} | {item.createdAt?.slice(0, 10)}
            </div>
            <div
              style={{
                whiteSpace: "pre-line",
                fontSize: 15,
                margin: "10px 0 0 2px",
                lineHeight: 1.7
              }}
            >
              {item.content}
            </div>
            {/* 첨부파일 표시 */}
            {item.files && item.files.length > 0 && (
              <div style={{ fontSize: 13, margin: "7px 0 0 0" }}>
                <b>첨부:</b>
                {item.files.map(f =>
                  <span key={f.name}>
                    &nbsp;
                    <a
  href={`/api/news/download/${encodeURIComponent(f.name)}`}
  download={f.originalName} // 이 속성도 가능
  style={{ color: "#226ad6", textDecoration: "underline" }}
  target="_blank" rel="noopener noreferrer"
>
  {f.originalName}
</a>
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
          등록된 공지사항이 없습니다.
        </div>
      )}
      {showBlog && <Blog limit={3} />}
    </div>
  );
}

export default News;