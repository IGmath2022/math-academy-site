import React, { useEffect, useState } from "react";
import axios from "axios";
import SchoolPeriodManager from "./SchoolPeriodManager";
import { API_URL } from '../../api';

function SchoolManager() {
  const [schools, setSchools] = useState([]);
  const [newSchool, setNewSchool] = useState("");

  const fetchSchools = async () => {
    const res = await axios.get(`${API_URL}/api/schools`);
    setSchools(res.data);
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

  const handleDelete = async id => {
    if (!window.confirm("정말 삭제할까요?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(
      `${API_URL}/api/schools/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchSchools();
  };
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

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
      {schools.map(s => (
        <li key={s.id} onClick={() => setSelectedSchoolId(s.id)}
            style={{ cursor: "pointer", fontWeight: selectedSchoolId === s.id ? 700 : 400 }}>
          {s.name}
        </li>
      ))}
    </ul>
      <ul style={{ padding: 0, margin: 0 }}>
        {schools.map(s => (
          <li key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <span style={{ flex: 1 }}>{s.name}</span>
            <button onClick={() => handleDelete(s.id)} style={{ marginLeft: 10, color: "#e14", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      {/* 해당 학교의 기간 관리 UI */}
    {selectedSchoolId && <SchoolPeriodManager schoolId={selectedSchoolId} />}
    </div>
  );
}

export default SchoolManager;