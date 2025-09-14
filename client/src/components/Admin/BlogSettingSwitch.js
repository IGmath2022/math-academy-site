import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const switchRow = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };

function BlogSettingSwitch() {
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/settings/blog_show`)
      .then((res) => setShow(res.data.show))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (e) => {
    const next = e.target.checked;
    setShow(next);
    const token = localStorage.getItem("token");
    await axios.post(
      `${API_URL}/api/settings/blog_show`,
      { show: next },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  if (loading) return <div style={{ color: "#777" }}>로딩 중…</div>;

  return (
    <div>
      <div style={switchRow}>
        <label style={{ fontWeight: 800, color: "#223" }}>
          <input type="checkbox" checked={show} onChange={handleChange} style={{ marginRight: 8 }} />
          네이버 블로그 새글 홈페이지에 노출
        </label>
      </div>
      <div style={{ fontSize: 12, color: "#667", marginTop: 6 }}>
        ※ 가볍게 켜고 끌 수 있도록 ‘컴팩트 카드’ 크기로 유지했습니다.
      </div>
    </div>
  );
}

export default BlogSettingSwitch;
