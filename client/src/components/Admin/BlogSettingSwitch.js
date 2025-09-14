import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function BlogSettingSwitch() {
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const getAuth = () => {
    const token = localStorage.getItem("token") || "";
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/settings/blog_show`);
        setShow(!!r.data?.show);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = async (e) => {
    const next = e.target.checked;
    setShow(next);
    try {
      await axios.post(`${API_URL}/api/settings/blog_show`, { show: next }, getAuth());
      setMsg("저장됨");
      setTimeout(() => setMsg(""), 1200);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
        return;
      }
      setMsg("저장 실패");
      setTimeout(() => setMsg(""), 1200);
    }
  };

  if (loading) return <div style={{ margin: "8px 0" }}>로딩 중...</div>;
  return (
    <div style={bar}>
      <label style={{ display: "inline-flex", alignItems: "center", fontWeight: 700 }}>
        <input type="checkbox" checked={show} onChange={handleChange} style={{ marginRight: 8 }} />
        네이버 블로그 새글 홈페이지에 노출
      </label>
      {msg && <span style={{ marginLeft: 10, color: "#227a22", fontWeight: 700 }}>{msg}</span>}
    </div>
  );
}

const bar = {
  width: "100%",
  maxWidth: 900,
  margin: "0 auto 14px",
  background: "#f7f9ff",
  border: "1px solid #e6e9f2",
  borderRadius: 12,
  padding: "10px 12px",
};

export default BlogSettingSwitch;
