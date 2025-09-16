import React from "react";

export default function Main() {
  return (
    <div
      style={{
        maxWidth: 520,
        margin: "48px auto",
        padding: "32px 5vw",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 18px #0001",
        minHeight: 280,
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>IG수학학원</h1>
        <div style={{ color: "#456", marginTop: 6 }}>메인 페이지(안전모드)</div>
      </header>

      <div style={{ lineHeight: 1.7, color: "#333" }}>
        이 화면이 보이면 라우팅/초기 렌더는 정상입니다.
        이후에 팝업배너, 카카오맵, 블로그 위젯, 공개설정 등
        부가요소를 순서대로 다시 붙이면서 어디서 깨지는지 찾으면 됩니다.
      </div>
    </div>
  );
}
