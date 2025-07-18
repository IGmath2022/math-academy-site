// /client/src/components/PhoneInputWithKeypad.js
import React from "react";

// 짧은 비프음 Base64 오디오
const BEEP_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAAgD///w==";
const beep = () => {
  const audio = new window.Audio(BEEP_SRC);
  audio.play();
};

export default function PhoneInputWithKeypad({ value, onChange, onEnter, disabled }) {
  // 버튼 입력 핸들러
  const handleInput = (v) => {
    if (disabled) return;
    if (value.length < 4) {
      beep();
      onChange(value + v);
    }
  };
  const handleBack = () => {
    if (disabled) return;
    beep();
    onChange(value.slice(0, -1));
  };
  const handleEnter = () => {
    if (disabled || value.length !== 4) return;
    beep();
    onEnter();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 7, margin: "16px 0 10px" }}>
        {value.padEnd(4, "•")}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 65px)",
        gap: 14,
        margin: "6px 0"
      }}>
        {[1,2,3,4,5,6,7,8,9,"back",0,"ok"].map((key, idx) =>
          key === "back" ? (
            <button key={idx} onClick={handleBack} disabled={disabled || !value.length}
              style={btnStyle(disabled || !value.length)}>
              ←
            </button>
          ) : key === "ok" ? (
            <button key={idx} onClick={handleEnter} disabled={disabled || value.length !== 4}
              style={btnStyle(disabled || value.length !== 4)}>
              확인
            </button>
          ) : (
            <button key={idx} onClick={() => handleInput(String(key))} disabled={disabled}
              style={btnStyle(disabled)}>
              {key}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// 버튼 스타일 함수
function btnStyle(disabled) {
  return {
    height: 58, fontSize: 22, borderRadius: 13, border: "none",
    background: disabled ? "#f0f0f0" : "#226ad6",
    color: disabled ? "#aaa" : "#fff",
    fontWeight: 700,
    transition: "background .12s",
    boxShadow: "0 1.5px 4px #0002",
    cursor: disabled ? "not-allowed" : "pointer"
  };
}