import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../api';

const MAX_BANNERS = 3;

const modalBase = {
  position: "fixed",
  top: "40px",
  zIndex: 2000,
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 8px 36px #2225",
  border: "2.5px solid #fee500",
  maxWidth: 370,
  minWidth: 210,
  padding: "30px 28px 22px 28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  animation: "popup-fadein .7s cubic-bezier(.5,1.8,.6,.97)",
  wordBreak: "keep-all",
  overflowWrap: "break-word",
};

const overlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  background: "rgba(0,0,0,.28)", zIndex: 1999
};

const positionStyles = [
  { left: "6vw" },
  { left: "50%", transform: "translateX(-50%)" },
  { right: "6vw", left: "auto" }
];

function PopupBanners() {
  const [banners, setBanners] = useState([]);
  const [visible, setVisible] = useState([true, true, true]);

  useEffect(() => {
    async function fetchAll() {
      let arr = [];
      for (let i = 1; i <= MAX_BANNERS; ++i) {
        const [text, on, img] = await Promise.all([
          axios.get(`${API_URL}/api/settings/banner${i}_text`).then(r => r.data?.value || ""),
          axios.get(`${API_URL}/api/settings/banner${i}_on`).then(r => r.data?.value === "true"),
          axios.get(`${API_URL}/api/settings/banner${i}_img`).then(r => r.data?.value || "")
        ]);
        arr.push({ text, img, on });
      }
      const filtered = arr.filter(b => b.on && (b.text || b.img));
      setBanners(filtered);
      setVisible(filtered.map(() => true));
    }
    fetchAll();
  }, []);

  const showAny = visible.some(v => v);
  if (!showAny || banners.length === 0) return null;

  return (
    <>
      <div style={overlayStyle} onClick={() => setVisible(visible.map(() => false))}></div>
      <div
        style={{
          position: "fixed",
          top: 40,
          left: 0,
          width: "100vw",
          display: "flex",
          justifyContent: banners.length === 3
            ? "space-between"
            : banners.length === 2
              ? "space-around"
              : "center",
          pointerEvents: "none",
          zIndex: 2001,
        }}
      >
        {banners.map((b, idx) => (
          visible[idx] && (
            <div
              key={idx}
              style={{
                ...modalBase,
                ...positionStyles[banners.length === 3 ? idx : (banners.length === 2 ? (idx === 0 ? 0 : 2) : 1)],
                pointerEvents: "auto",
              }}
            >
              <button
                style={{
                  position: "absolute", top: 8, right: 13,
                  background: "none", border: "none",
                  fontSize: 22, fontWeight: 800, color: "#444a",
                  cursor: "pointer", lineHeight: 1,
                }}
                aria-label="닫기"
                title="닫기"
                onClick={() => setVisible(v => v.map((vv, i) => i === idx ? false : vv))}
              >×</button>
              {b.img &&
                <img
                  src={b.img} // ✅ R2 전체 URL 그대로 사용
                  alt="배너이미지"
                  style={{ maxWidth: 260, maxHeight: 120, borderRadius: 9, marginBottom: 12, boxShadow: "0 1px 7px #0002" }}
                />
              }
              {b.text &&
                <div style={{
                  marginBottom: 5, fontWeight: 700,
                  fontSize: 18, color: "#202015", textAlign: "center", wordBreak: "break-word"
                }}>{b.text}</div>
              }
            </div>
          )
        ))}
      </div>
      <style>{`
        @keyframes popup-fadein {
          0% { opacity: 0;}
          100% { opacity: 1;}
        }
        @media (max-width: 800px) {
          .popup-banners-wrapper {
            flex-direction: column !important;
            align-items: center !important;
            gap: 14px;
          }
          .popup-banners-wrapper > div {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </>
  );
}

export default PopupBanners;