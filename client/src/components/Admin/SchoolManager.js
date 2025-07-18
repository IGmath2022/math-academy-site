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
    fetchSchools();
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(schools.length / pageSize);
  const pagedSchools = schools.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{
      border: "1px solid #e7e9ef", background: "#f8fafd",
      borderRadius: 11, padding: "22px 10px", marginBottom: 28, maxWidth: 470, margin: "0 auto"
    }}>
      <h3 style={{ margin: 0, fontSize: 17, marginBottom: 10 }}>학교 관리</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={newSchool}
          onChange={e => setNewSchool(e.target.value)}
          placeholder="학교명 입력"
          style={{ flex: 1, padding: "7px 9px", borderRadius: 7, border: "1px solid #ccd" }}
        />
        <button onClick={handleAdd} style={{ borderRadius: 7, padding: "7px 16px", fontWeight: 600, background: "#226ad6", color: "#fff", border: "none" }}>
          추가
        </button>
      </div>
      <ul>
        {pagedSchools.map(s => (
          <li key={s._id}
              onClick={() => setSelectedSchoolId(s._id)}
              style={{ cursor: "pointer", fontWeight: selectedSchoolId === s._id ? 700 : 400 }}>
            {s.name}
          </li>
        ))}
      </ul>
      <ul style={{ padding: 0, margin: 0 }}>
        {pagedSchools.map(s => (
          <li key={s._id} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <span style={{ flex: 1 }}>{s.name}</span>
            <button onClick={() => handleDelete(s._id)} style={{ marginLeft: 10, color: "#e14", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      {/* 페이지네이션 버튼 */}
      {totalPages > 1 && (
        <div style={{ margin: "12px 0", textAlign: "center" }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                margin: 2,
                padding: "5px 13px",
                borderRadius: 7,
                border: "none",
                background: i + 1 === page ? "#226ad6" : "#eee",
                color: i + 1 === page ? "#fff" : "#444",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
      {/* 해당 학교의 기간 관리 UI */}
      {selectedSchoolId && <SchoolPeriodManager schoolId={selectedSchoolId} />}
    </div>
  );
}

export default SchoolManager;