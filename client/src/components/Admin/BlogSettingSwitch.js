import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function BlogSettingSwitch() {
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/settings/blog_show`)
      .then(res => setShow(res.data.show))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (e) => {
    setShow(e.target.checked);
    await axios.post(`${API_URL}/api/settings/blog_show`, { show: e.target.checked });
  };

  if (loading) return <span>로딩 중...</span>;
  return (
    <div style={{ margin: "18px 0" }}>
      <label style={{ fontWeight: 700 }}>
        <input type="checkbox" checked={show} onChange={handleChange} style={{ marginRight: 8 }} />
        네이버 블로그 새글 홈페이지에 노출
      </label>
    </div>
  );
}

export default BlogSettingSwitch;