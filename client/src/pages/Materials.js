import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [role, setRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole || "");
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/materials`);
      setMaterials(res.data);
    } catch (err) {
      console.error("자료 불러오기 실패", err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API_URL}/api/materials/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      fetchMaterials();
    } catch (err) {
      console.error("업로드 실패", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px" }}>
      <h2 style={{ marginBottom: 20 }}>자료실</h2>

      {role === "admin" && (
        <div style={{ marginBottom: 30 }}>
          <input type="file" onChange={handleFileChange} />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              marginLeft: 8,
              padding: "6px 12px",
              background: "#226ad6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
      )}

      {materials.length === 0 ? (
        <p style={{ color: "#666" }}>등록된 자료가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {materials.map((mat) => (
            <li
              key={mat._id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ flex: "1 1 auto", marginRight: 12 }}>
                {mat.originalName || mat.name || "이름 없는 파일"}
              </span>
              <a
                href={mat.url}
                download={mat.originalName || mat.name || "자료"}
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#226ad6",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                다운로드
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}