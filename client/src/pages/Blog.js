import React, { useEffect, useState } from "react";

function Blog({limit=7}) {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/blog")
      .then(res => res.json())
      .then(list => setList(list.slice(0, limit)))
      .catch(() => setError("블로그 데이터를 불러오지 못했습니다."));
  }, [limit]);

  return (
    <div className="container" style={{
      maxWidth: 650, margin: "40px auto", padding: "4vw 2vw",
      background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px #0001"
    }}>
      <h2>IG수학 네이버 블로그 새글</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {list.map((item, i) => (
          <li key={i} style={{ marginBottom: 25 }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
              {item.title}
            </a>
            <div style={{ color: "#555", fontSize: 13, marginBottom: 3 }}>
              {item.pubDate?.slice(0, 16)}
            </div>
            <div style={{ color: "#666", fontSize: 15 }}>
              {item.summary?.slice(0, 80)}{item.summary?.length > 80 && "…"}
            </div>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 30, textAlign: "right" }}>
        <a href="https://blog.naver.com/igmath2022" target="_blank" rel="noopener noreferrer"
          style={{ color: "#1ec800", fontWeight: 700, textDecoration: "underline" }}>
          블로그 바로가기 →
        </a>
      </div>
    </div>
  );
}

export default Blog;