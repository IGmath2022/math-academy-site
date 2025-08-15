import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

const MAX_BANNERS = 3;
const initialBanner = { text: "", on: false, img: "" };

function BannerAdmin() {
  const [banners, setBanners] = useState(
    Array(MAX_BANNERS).fill(null).map(() => ({ ...initialBanner }))
  );

  useEffect(() => {
    async function fetchAll() {
      let arr = [];
      for (let i = 1; i <= MAX_BANNERS; ++i) {
        const [text, on, img] = await Promise.all([
          axios.get(`${API_URL}/api/settings/banner${i}_text`).then(r => r.data?.value || ""),
          axios.get(`${API_URL}/api/settings/banner${i}_on`).then(r => r.data?.value === "true"),
          axios.get(`${API_URL}/api/settings/banner${i}_img`).then(r => r.data?.value || "")
        ]);
        arr.push({ text, on, img });
      }
      setBanners(arr);
    }
    fetchAll();
  }, []);

  const handleSave = async (i) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_URL}/api/settings`, { key: `banner${i+1}_text`, value: banners[i].text }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await axios.post(`${API_URL}/api/settings`, { key: `banner${i+1}_on`, value: String(banners[i].on) }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await axios.post(`${API_URL}/api/settings`, { key: `banner${i+1}_img`, value: banners[i].img }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert(`배너${i+1} 저장됨!`);
  };

  const handleFile = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const token = localStorage.getItem("token");

    // R2 업로드 API 호출
    const res = await axios.post(`${API_URL}/api/materials/upload`, form, {
      headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
    });

    // 업로드된 전체 URL 저장
    const next = banners.slice();
    next[idx].img = res.data.url; // <-- 변경: filename 대신 url
    setBanners(next);
  };

  const handleChange = (idx, key, val) => {
    const next = banners.slice();
    next[idx][key] = val;
    setBanners(next);
  };

  return (
    <div style={{ border: "1.5px solid #f8e71c", borderRadius: 12, padding: 18, marginBottom: 20, background: "#fffbe8" }}>
      <h3>이벤트·공지 팝업 배너 (최대 3개)</h3>
      {banners.map((b, i) => (
        <div key={i} style={{marginBottom: 20, padding: 14, border: "1.5px solid #eee", borderRadius: 8}}>
          <label style={{ fontWeight: 600, marginRight: 12 }}>
            <input type="checkbox" checked={b.on} onChange={e => handleChange(i, "on", e.target.checked)} />
            &nbsp;배너{i+1} 표시 ON/OFF
          </label>
          <br />
          <textarea
            style={{ width: "95%", marginTop: 10, padding: 8, borderRadius: 8, border: "1.3px solid #ffe477", fontSize: 15 }}
            rows={2}
            value={b.text}
            onChange={e => handleChange(i, "text", e.target.value)}
            placeholder={`배너${i+1} 안내문`}
          />
          <br />
          <input type="file" accept="image/*" onChange={e => handleFile(e, i)} />
          {b.img &&
            <div style={{marginTop: 8}}>
              <img src={b.img} alt="배너이미지" style={{maxWidth: 200, borderRadius: 6, boxShadow: "0 1px 6px #0002"}} />
              <button type="button" style={{marginLeft: 8}} onClick={() => handleChange(i, "img", "")}>삭제</button>
            </div>
          }
          <br />
          <button style={{marginTop: 8, padding: "6px 18px", borderRadius: 8, background: "#fee500", border: "none", fontWeight: 600}}
            onClick={() => handleSave(i)}
          >저장</button>
        </div>
      ))}
    </div>
  );
}
export default BannerAdmin;