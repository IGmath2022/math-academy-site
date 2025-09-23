// client/src/components/Admin/SchoolManager.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import SchoolPeriodManager from "./SchoolPeriodManager";
import { API_URL } from '../../api';

function SchoolManager() {
  const [schools, setSchools] = useState([]);
  const [newSchool, setNewSchool] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const fetchSchools = async () => {
    const res = await axios.get(`${API_URL}/api/schools`);
    setSchools(res.data);
    setPage(1); // 학교 추가/삭제시 1페이지로
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleAdd = async () => {
    if (!newSchool.trim()) return;
    const token = localStorage.getItem("token");
    await axios.post(
      `${API_URL}/api/schools`,
      { name: newSchool },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewSchool("");
    fetchSchools();
  };

  const handleDelete = async _id => {
    if (!window.confirm("정말 삭제할까요?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(
      `${API_URL}/api/schools/${_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // 선택되어 있던 학교를 삭제하면 상세를 닫아줌
    if (selectedSchoolId === _id) setSelectedSchoolId(null);
    fetchSchools();
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(schools.length / pageSize);
  const pagedSchools = schools.slice((page - 1) * pageSize, page * pageSize);

  // 공통 버튼 스타일
  const btn = (bg, color = "#fff", border = "0") => ({
    padding: "10px 14px",
    background: bg,
    color,
    fontWeight: 600,
    border,
    borderRadius: 10,
    cursor: "pointer",
    transition: "transform .05s ease, box-shadow .15s ease",
    boxShadow: "0 2px 8px rgba(22, 119, 255, 0.10)"
  });

  return (
    <div style={{ padding: 16 }}>
      {/* 헤더 카드 */}
      <div
        style={{
          border: "1px solid #e7e9ef",
          background:
            "linear-gradient(180deg, #f7faff 0%, #ffffff 100%)",
          borderRadius: 14,
          padding: "18px 16px",
          marginBottom: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 10, height: 10, borderRadius: 9999,
              background: "#1677ff", boxShadow: "0 0 0 4px rgba(22,119,255,.12)"
            }}
          />
          <h2 style={{ margin: 0, color: "#223355", fontSize: 20 }}>학교 관리</h2>
        </div>
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          학교 추가/삭제와 선택한 학교의 <b>학기·일정(기간)</b>을 관리합니다.
          학교를 클릭하면 아래에 해당 학교의 기간 관리가 열립니다.
        </div>
      </div>

      {/* 상단 폼 + 목록을 2단 레이아웃 카드로 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 420px) 1fr",
          gap: 16
        }}
      >
        {/* 입력 카드: 인풋이 작아보이지 않도록 레이블/폭 강화 */}
        <div
          style={{
            border: "1px solid #e8edf7",
            background: "#fff",
            borderRadius: 14,
            padding: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 6, height: 18, borderRadius: 4, background: "#1677ff" }} />
            <div style={{ fontWeight: 700, color: "#344767" }}>학교 추가</div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, color: "#4b5563" }} htmlFor="schoolName">
              학교명
            </label>
            <input
              id="schoolName"
              placeholder="예) 서울수학중학교"
              value={newSchool}
              onChange={(e) => setNewSchool(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 15,
                lineHeight: 1.4,
                borderRadius: 10,
                border: "1px solid #cfd8ea",
                outline: "none",
                background: "#fff"
              }}
              aria-label="학교명 입력"
            />

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button
                onClick={handleAdd}
                disabled={!newSchool.trim()}
                style={{
                  ...btn("#1677ff"),
                  opacity: newSchool.trim() ? 1 : 0.6
                }}
                title="학교 추가"
              >
                추가
              </button>
              <button
                onClick={() => setNewSchool("")}
                style={btn("#f3f4f6", "#111827", "1px solid #e5e7eb")}
                title="입력 초기화"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 목록 카드: 행 간격/타이포 개선, 선택 상태 시 강조 */}
        <div
          style={{
            border: "1px solid #e8edf7",
            background: "#fff",
            borderRadius: 14,
            padding: 12,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 8px 4px" }}>
            <div style={{ fontWeight: 700, color: "#344767" }}>
              학교 목록 <span style={{ color: "#6b7280", fontWeight: 500 }}>({schools.length})</span>
            </div>
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    style={{
                      padding: "6px 10px",
                      background: page === i + 1 ? "#1677ff" : "#fff",
                      color: page === i + 1 ? "#fff" : "#223355",
                      border: "1px solid #c7d2e8",
                      borderRadius: 8,
                      cursor: "pointer"
                    }}
                    aria-label={`${i + 1}페이지로 이동`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              border: "1px solid #eef2fb",
              borderRadius: 12,
              overflow: "hidden"
            }}
          >
            {pagedSchools.length === 0 ? (
              <div style={{ padding: 16, color: "#8c98a4", fontSize: 14 }}>등록된 학교가 없습니다.</div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {pagedSchools.map(s => {
                  const selected = selectedSchoolId === s._id;
                  return (
                    <li
                      key={s._id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        borderBottom: "1px solid #f2f5fb",
                        background: selected ? "linear-gradient(90deg, #f0f7ff 0%, #ffffff 100%)" : "#fff"
                      }}
                    >
                      <button
                        onClick={() => setSelectedSchoolId(prev => prev === s._id ? null : s._id)}
                        title="이 학교의 기간 관리 열기"
                        style={{
                          textAlign: "left",
                          background: "transparent",
                          border: 0,
                          padding: 0,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          color: "#223355",
                          fontWeight: 600
                        }}
                        aria-expanded={selected}
                        aria-controls={`school-period-panel-${s._id}`}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 8, height: 8, borderRadius: 99,
                            background: selected ? "#1677ff" : "#c7d2e8",
                            boxShadow: selected ? "0 0 0 4px rgba(22,119,255,.10)" : "none",
                            transition: "all .15s ease"
                          }}
                        />
                        {s.name}
                      </button>

                      <button
                        onClick={() => handleDelete(s._id)}
                        style={{
                          ...btn("#fff1f0", "#cf1322", "1px solid #ffccc7"),
                          boxShadow: "none"
                        }}
                        title="학교 삭제"
                      >
                        삭제
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 선택된 학교의 기간 관리 패널: 위 입력폼을 덮지 않고, 아래 별도 카드로 표시 */}
      {selectedSchoolId && (
        <div
          id={`school-period-panel-${selectedSchoolId}`}
          style={{
            marginTop: 18,
            border: "1px solid #e8edf7",
            background: "#fff",
            borderRadius: 14,
            padding: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px 10px" }}>
            <div style={{ width: 6, height: 18, borderRadius: 4, background: "#10b981" }} />
            <div style={{ fontWeight: 700, color: "#0f172a" }}>선택한 학교의 학기·일정 관리</div>
          </div>
          <SchoolPeriodManager />
        </div>
      )}
    </div>
  );
}

export default SchoolManager;
