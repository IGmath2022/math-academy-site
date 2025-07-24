import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

function FileUpload({ onUploaded, folder = "academy", academyId = "default" }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState("");

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("파일을 선택하세요");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("academyId", academyId);
    formData.append("folder", folder);

    const res = await axios.post(`${API_URL}/api/files/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
    });
    setUploadUrl(res.data.url);
    setFile(null);
    setProgress(0);
    if (onUploaded) onUploaded(res.data);
  };

  return (
    <div style={{ margin: "15px 0" }}>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 8 }}>
        업로드
      </button>
      {progress > 0 && progress < 100 && (
        <span style={{ marginLeft: 12 }}>{progress}%</span>
      )}
      {uploadUrl && (
        <div>
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
            업로드된 파일 보기
          </a>
        </div>
      )}
    </div>
  );
}

export default FileUpload;