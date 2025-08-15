import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

const MAX_BANNERS = 3;

function PopupBannerAdmin() {
  const [banners, setBanners] = useState(
    Array.from({ length: MAX_BANNERS }, () => ({ text: "", on: false, img: "", file: null }))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      const arr = [];
      for (let i = 1; i <= MAX_BANNERS; ++i) {
        const [text, on, img] = await Promise.all([
          axios.get(`${API_URL}/api/settings/banner${i}_text`).then(r => r.data?.value || "").catch(() => ""),
          axios.get(`${API_URL}/api/settings/banner${i}_on`).then(r => r.data?.value === "true").catch(() => false),
          axios.get(`${API_URL}/api/settings/banner${i}_img`).then(r => r.data?.value || "").catch(() => ""),
        ]);
        arr.push({ text, on, img, file: null });
      }
      setBanners(arr);
    }
    fetchAll();
  }, []);

  const handleChange = (idx, field, value) => {
    setBanners(b => b.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const handleSave = async () => {
    setSaving(true);
    for (let i = 0; i < MAX_BANNERS; ++i) {
      await axios.post(`${API_URL}/api/settings`, { key: `banner${i+1}_text`, value: banners[i].text });
      await axios.post(`${API_URL}/api/settings`, { key: `banner${i+1}_on`, value: String(banners[i].on) });

      if (banners[i].file) {
        const form = new FormData();
        form.append("file", banners[i].file);
        const res = await axios.post(`${API_URL}/api/files/upload`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data?.url) {
          await axios.post(`${API_URL}/api/settings`, { key: `banner${i+1}_img`, value: res.data.url });
        }
      }
    }
    setSaving(false);
    window.location.reload();
  };

  return (
    <div style={{ border: "1px solid #aaa", borderRadius: 10, padding: 20, margin: "32px 0" }}>
      <h3>팝업 배너 관리</h3>
      {banners.map((b, i) =>
        <div key={i} style={{ marginBottom: 18, border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
          <b>배너 #{i+1}</b>
          <label style={{ display: "block", marginTop: 8 }}>
            <input type="checkbox" checked={b.on} onChange={e => handleChange(i, "on", e.target.checked)} />
            활성화
          </label>
          <input
            placeholder="배너 문구"
            value={b.text}
            onChange={e => handleChange(i, "text", e.target.value)}
            style={{ width: "98%", margin: "10px 0 6px 0", fontSize: 15, padding: 6 }}
          />
          <div>
            <input type="file" accept="image/*" onChange={e => handleChange(i, "file", e.target.files[0])} />
            {b.img && <img src={b.img} alt="배너 미리보기" style={{ height: 42, borderRadius: 7 }} />}
            {b.img && <button onClick={() => handleChange(i, "img", "")}>이미지 제거</button>}
          </div>
        </div>
      )}
      <button onClick={handleSave} disabled={saving}>
        {saving ? "저장중..." : "모든 배너 저장"}
      </button>
    </div>
  );
}

export default PopupBannerAdmin;