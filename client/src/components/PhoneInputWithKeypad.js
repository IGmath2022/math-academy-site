// /client/src/components/PhoneInputWithKeypad.js
import React from "react";

const BEEP_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAAgD///w==";
const beep = () => {
  const audio = new window.Audio(BEEP_SRC);
  audio.play();
};

export default function PhoneInputWithKeypad({ value, onChange, onEnter, disabled }) {
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
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none",
      width: "98vw", maxWidth: 500, margin: "0 auto"
    }}>
      <div style={{
        fontSize: "3.2rem", fontWeight: 800, letterSpacing: 14, margin: "19px 0 13px", color: "#183066"
      }}>
        {value.padEnd(4, "•")}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(82px, 1fr))",
        gap: 17,
        width: "100%"
      }}>
        {[1,2,3,4,5,6,7,8,9,"back",0,"ok"].map((key, idx) =>
          key === "back" ? (
            <button key={idx} onClick={handleBack} disabled={disabled || !value.length}
              style={keypadBtnStyle(disabled || !value.length)}>
              ←
            </button>
          ) : key === "ok" ? (
            <button key={idx} onClick={handleEnter} disabled={disabled || value.length !== 4}
              style={keypadBtnStyle(disabled || value.length !== 4, true)}>
              확인
            </button>
          ) : (
            <button key={idx} onClick={() => handleInput(String(key))} disabled={disabled}
              style={keypadBtnStyle(disabled)}>
              {key}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function keypadBtnStyle(disabled, okBtn = false) {
  return {
    height: 96, minWidth: 0, width: "100%",
    fontSize: okBtn ? "2.3rem" : "2.7rem",
    borderRadius: 18, border: "none",
    background: disabled ? "#f0f0f0" : okBtn ? "#32a852" : "#226ad6",
    color: disabled ? "#aaa" : "#fff",
    fontWeight: 800,
    boxShadow: "0 2px 9px #0002",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .11s"
  };
}