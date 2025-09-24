import React, { useEffect, useState } from "react";
import { usePublicSiteSettings } from "../utils/sitePublic";

const modalBase = {
  position: "relative",
  zIndex: 2000,
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 8px 36px #2225",
  border: "2.5px solid #fee500",
  width: "min(360px, calc(100vw - 48px))",
  maxWidth: 360,
  minWidth: 220,
  padding: "30px 28px 22px 28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  animation: "popup-fadein .7s cubic-bezier(.5,1.8,.6,.97)",
  wordBreak: "keep-all",
  overflowWrap: "break-word",
  boxSizing: "border-box",
};

const overlayStyle = {
  position: "fixed", top:0, left:0, width:"100vw", height:"100vh",
  background: "rgba(0,0,0,.28)", zIndex: 1999
};

function PopupBanners() {
  const { settings } = usePublicSiteSettings();
  const [visible, setVisible] = useState([]);

  // 새로운 방식: 슈퍼 설정에서 popupBanners 배열 가져오기
  const banners = (settings?.popupBanners || []).filter(banner =>
    banner && banner.visible && (banner.imageUrl || banner.title)
  );

  useEffect(() => {
    setVisible(banners.map(() => true));
  }, [banners.length]);

  const showAny = visible.some(v => v);

  if (!showAny || banners.length === 0) return null;

  return (
    <>
      <div style={overlayStyle} onClick={() => setVisible(visible.map(() => false))}></div>
      <div
        className="popup-banners-wrapper"
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
          alignItems: "flex-start",
          gap: 18,
          padding: "0 6vw",
          flexWrap: banners.length > 1 ? "wrap" : "nowrap",
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

              {b.imageUrl &&
                <img
                  src={b.imageUrl}
                  alt={b.title || "배너이미지"}
                  style={{ maxWidth: 260, maxHeight: 120, borderRadius: 9, marginBottom: 12, boxShadow: "0 1px 7px #0002" }}
                />
              }

              {b.title &&
                <div style={{
                  marginBottom: 8, fontWeight: 700,
                  fontSize: 18, color: "#202015", textAlign: "center", wordBreak: "break-word"
                }}>{b.title}</div>
              }

              {b.body &&
                <div style={{
                  marginBottom: 12, fontSize: 14, color: "#555", textAlign: "center",
                  wordBreak: "break-word", lineHeight: 1.4
                }}>{b.body}</div>
              }

              {b.linkUrl && b.linkText &&
                <a
                  href={b.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block", padding: "8px 16px", background: "#fee500",
                    color: "#333", textDecoration: "none", borderRadius: 6, fontWeight: 600,
                    fontSize: 14, transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#ffd700"}
                  onMouseOut={(e) => e.target.style.background = "#fee500"}
                >
                  {b.linkText}
                </a>
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
            gap: 16px;
            padding: 0 18px !important;
          }
          .popup-banners-wrapper > div {
            width: min(360px, calc(100vw - 36px)) !important;
          }
        }
      `}</style>
    </>
  );
}

export default PopupBanners;