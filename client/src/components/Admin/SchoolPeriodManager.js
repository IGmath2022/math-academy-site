import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function SchoolPeriodManager() {
  const [schools, setSchools] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(""); // "" = 전체
  const [newPeriod, setNewPeriod] = useState({
    schoolId: "",
    name: "",
    type: "방학",
    start: "",
    end: "",
    note: "",
  });

  // axios 요청에 항상 토큰 포함시키는 함수
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // 학교 리스트 로딩 (인증 필요)
  useEffect(() => {
    axios.get("${API_URL}/api/schools", getAuthConfig())
      .then(res => setSchools(res.data));
  }, []);

  // 일정(기간) 리스트 로딩
  const fetchPeriods = async (schoolId = "") => {
    const url = schoolId ? `${API_URL}/api/school-periods?schoolId=${schoolId}` : `${API_URL}/api/school-periods`;
    const res = await axios.get(url, getAuthConfig());
    setPeriods(res.data);
  };

  useEffect(() => {
    fetchPeriods(selectedSchoolId);
    // eslint-disable-next-line
  }, [selectedSchoolId]);

  // 입력 핸들
  const handleNewPeriodChange = e => {
    setNewPeriod({
      ...newPeriod,
      [e.target.name]: e.target.value,
    });
  };

  // 기간 추가
  const handleAdd = async () => {
    if (!newPeriod.name || !newPeriod.start || !newPeriod.end || !newPeriod.schoolId) {
      alert("학교, 기간명, 시작일, 종료일을 모두 입력하세요.");
      return;
    }
    try {
      await axios.post("${API_URL}/api/school-periods", newPeriod, getAuthConfig());
      setNewPeriod({ schoolId: "", name: "", type: "방학", start: "", end: "", note: "" });
      fetchPeriods(selectedSchoolId);
    } catch (e) {
      alert("추가 실패: " + (e.response?.data?.message || e.message));
    }
  };

  // 삭제
  const handleDelete = async id => {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await axios.delete(`${API_URL}/api/school-periods/${id}`, getAuthConfig());
      fetchPeriods(selectedSchoolId);
    } catch (e) {
      alert("삭제 실패: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div style={{
      border: "1px solid #e7e9ef", background: "#f8fafd",
      borderRadius: 11, padding: "22px 10px", marginBottom: 28, maxWidth: 470, margin: "0 auto"
    }}>
      <h3 style={{ margin: 0, fontSize: 17, marginBottom: 10 }}>학교 일정/기간 관리</h3>

      {/* 학교 선택 */}
      <select
        value={selectedSchoolId}
        onChange={e => setSelectedSchoolId(e.target.value)}
        style={{ padding: "7px 12px", borderRadius: 6, marginBottom: 16, width: "100%" }}
      >
        <option value="">전체 학교 보기</option>
        {schools.map(s =>
          <option key={s.id} value={s.id}>{s.name}</option>
        )}
      </select>

      {/* 일정 등록 폼 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <select
          name="schoolId"
          value={newPeriod.schoolId}
          onChange={handleNewPeriodChange}
          style={{ padding: "6px 8px", borderRadius: 7, flex: 1 }}
        >
          <option value="">학교선택</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input name="name" value={newPeriod.name} onChange={handleNewPeriodChange} placeholder="기간명(예: 여름방학)" style={{ flex: 2, padding: "6px 8px", borderRadius: 7 }} />
        <select name="type" value={newPeriod.type} onChange={handleNewPeriodChange} style={{ padding: "6px 8px", borderRadius: 7 }}>
          <option value="방학">방학</option>
          <option value="시험">시험</option>
          <option value="행사">행사</option>
          <option value="기타">기타</option>
        </select>
        <input name="start" type="date" value={newPeriod.start} onChange={handleNewPeriodChange} style={{ padding: "6px 8px", borderRadius: 7 }} />
        <input name="end" type="date" value={newPeriod.end} onChange={handleNewPeriodChange} style={{ padding: "6px 8px", borderRadius: 7 }} />
        <input name="note" value={newPeriod.note} onChange={handleNewPeriodChange} placeholder="비고(선택)" style={{ flex: 2, padding: "6px 8px", borderRadius: 7 }} />
        <button onClick={handleAdd} style={{ borderRadius: 7, padding: "7px 14px", fontWeight: 600, background: "#226ad6", color: "#fff", border: "none" }}>추가</button>
      </div>

      {/* 일정 목록 */}
      <ul style={{ padding: 0, margin: 0 }}>
        {periods.map(p => (
          <li key={p.id} style={{ display: "flex", alignItems: "center", marginBottom: 6, fontSize: 15 }}>
            <span style={{ flex: 2 }}>
              [{p.School?.name}] {p.name} ({p.type}) {p.start} ~ {p.end}
              {p.note && <> - <span style={{ color: "#567" }}>{p.note}</span></>}
            </span>
            <button onClick={() => handleDelete(p.id)} style={{ marginLeft: 10, color: "#e14", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}>
              삭제
            </button>
          </li>
        ))}
        {periods.length === 0 && <li style={{ color: "#888", padding: 10 }}>등록된 일정이 없습니다.</li>}
      </ul>
    </div>
  );
}

export default SchoolPeriodManager;