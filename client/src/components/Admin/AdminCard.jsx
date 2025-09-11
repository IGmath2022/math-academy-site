// client/src/components/Admin/AdminCard.jsx
import React from "react";

/**
 * 관리자 패널 공용 카드 래퍼
 * - 일관된 여백/테두리/그림자/코너 적용
 * - title 전달 시 상단 헤더 바 노출
 */
export default function AdminCard({ title, children, right }) {
  return (
    <div style={card}>
      {(title || right) && (
        <div style={hd}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
          <div>{right}</div>
        </div>
      )}
      <div style={body}>{children}</div>
    </div>
  );
}

const card = {
  background: "#fff",
  border: "1px solid #e5e8f2",
  borderRadius: 14,
  boxShadow: "0 2px 14px #0001",
  overflow: "hidden",
};

const hd = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "14px 18px",
  background: "linear-gradient(180deg,#f7fbff,#eef4ff)",
  borderBottom: "1px solid #eaf0ff",
};

const body = {
  padding: 16,
};
