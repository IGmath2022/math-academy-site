// client/src/components/Admin/SchoolPeriodManager.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

/** 
 * 서버 스키마 맞춤 (SchoolPeriod):
 * - required: schoolId, name, start, end
 * - optional: type, note
 * 엔드포인트: /api/school-periods (GET, POST, PUT, DELETE)
 *  ※ app.js에서 /api/schools/periods 별칭도 있지만, 여기선 /api/school-periods 사용
 */

function SchoolPeriodManager() {
  const [schools, setSchools] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [form, setForm] = useState({
    schoolId: "",
    name: "",
    type: "방학",
    start: "",
    end: "",
    note: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/schools`, getAuthConfig());
      setSchools(res.data || []);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("학원 관리 에러:", err);
      }
      setMsg("학교 목록을 불러오지 못했습니다.");
    }
  };

  const fetchPeriods = async (schoolId = "") => {
    try {
      const url = schoolId
        ? `${API_URL}/api/school-periods?schoolId=${schoolId}`
        : `${API_URL}/api/school-periods`;
      const res = await axios.get(url, getAuthConfig());
      setPeriods(res.data || []);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("학원 관리 에러:", err);
      }
      setMsg("학교 기간 목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchPeriods();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectSchool = (e) => {
    const val = e.target.value;
    setSelectedSchoolId(val);
    fetchPeriods(val);
  };

  const resetForm = () => {
    setForm({ schoolId: "", name: "", type: "방학", start: "", end: "", note: "" });
    setEditingId(null);
  };

  const handleAdd = async () => {
    setMsg(null);
    if (!selectedSchoolId && !form.schoolId) {
      setMsg("학교를 먼저 선택하세요.");
      return;
    }
    if (!form.name) {
      setMsg("기간 이름을 입력하세요.");
      return;
    }
    if (!form.start || !form.end) {
      setMsg("시작/종료 날짜를 입력하세요.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/school-periods`, {
        schoolId: selectedSchoolId || form.schoolId,
        name: form.name,
        type: form.type,
        start: form.start,   // YYYY-MM-DD
        end: form.end,       // YYYY-MM-DD
        note: form.note
      }, getAuthConfig());
      await fetchPeriods(selectedSchoolId);
      resetForm();
      setMsg("기간이 추가되었습니다.");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("학원 관리 에러:", err);
      }
      setMsg(err?.response?.data?.message || "기간 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      schoolId: p.schoolId || p.school?._id || "",
      name: p.name ?? "",
      type: p.type ?? "방학",
      start: p.start ? String(p.start).slice(0, 10) : "", // 서버는 문자열 보관 (YYYY-MM-DD)
      end: p.end ? String(p.end).slice(0, 10) : "",
      note: p.note ?? ""
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setMsg(null);
    if (!form.name || !form.start || !form.end) {
      setMsg("이름/시작/종료는 필수입니다.");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/school-periods/${editingId}`, {
        name: form.name,
        type: form.type,
        start: form.start,
        end: form.end,
        note: form.note
        // 서버 라우트상 schoolId 변경은 처리하지 않는 것으로 구현되어 있음
      }, getAuthConfig());
      await fetchPeriods(selectedSchoolId);
      resetForm();
      setMsg("기간이 수정되었습니다.");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("학원 관리 에러:", err);
      }
      setMsg(err?.response?.data?.message || "기간 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (_id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/school-periods/${_id}`, getAuthConfig());
      await fetchPeriods(selectedSchoolId);
      setMsg("삭제되었습니다.");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("학원 관리 에러:", err);
      }
      setMsg(err?.response?.data?.message || "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      {/* 헤더 */}
      <div style={s.cardHeader}>
        <div style={s.headerDot} />
        <div>
          <div style={s.h4}>학교 기간 관리</div>
          <div style={s.subtle}>학교별 학기/일정(기간) 추가·수정·삭제</div>
        </div>
      </div>

      {/* 학교 선택 */}
      <div style={s.toolbar}>
        <select
          value={selectedSchoolId}
          onChange={handleSelectSchool}
          style={s.input}
        >
          <option value="">전체 학교</option>
          {schools.map(school => (
            <option key={school._id} value={school._id}>{school.name}</option>
          ))}
        </select>
        {msg && <div style={s.alertInfo}>{msg}</div>}
      </div>

      {/* 입력 카드 */}
      <div style={s.card}>
        <div style={s.sectionTitleWrap}>
          <div style={s.sectionBar} />
          <div style={s.sectionTitle}>기간 추가 / 수정</div>
        </div>

        <div style={s.formGrid}>
          <select
            name="schoolId"
            value={form.schoolId}
            onChange={handleChange}
            style={s.input}
          >
            <option value="">학교 선택</option>
            {schools.map(school => (
              <option key={school._id} value={school._id}>{school.name}</option>
            ))}
          </select>
          <input
            name="name"
            placeholder="기간명(예: 1학기, 여름방학)"
            value={form.name}
            onChange={handleChange}
            style={s.input}
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            style={s.input}
          >
            <option value="방학">방학</option>
            <option value="학기">학기</option>
            <option value="시험">시험</option>
          </select>
          <input
            type="date"
            name="start"
            value={form.start}
            onChange={handleChange}
            style={s.input}
          />
          <input
            type="date"
            name="end"
            value={form.end}
            onChange={handleChange}
            style={s.input}
          />
          <input
            name="note"
            placeholder="메모"
            value={form.note}
            onChange={handleChange}
            style={{ ...s.input, gridColumn: "span 2" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {editingId ? (
            <>
              <button onClick={handleUpdate} disabled={loading} style={btn.primary}>저장</button>
              <button onClick={resetForm} disabled={loading} style={btn.ghost}>취소</button>
            </>
          ) : (
            <button onClick={handleAdd} disabled={loading} style={btn.success}>추가</button>
          )}
        </div>
      </div>

      {/* 목록 카드 */}
      <div style={s.card}>
        <div style={s.sectionTitleWrap}>
          <div style={s.sectionBar} />
          <div style={s.sectionTitle}>기간 목록 ({periods.length})</div>
        </div>

        <div style={{ border: "1px solid #eef2fb", borderRadius: 12, overflow: "hidden" }}>
          <table width="100%" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafd" }}>
                <Th>학교</Th>
                <Th>기간명</Th>
                <Th>유형</Th>
                <Th>시작</Th>
                <Th>종료</Th>
                <Th>메모</Th>
                <Th>관리</Th>
              </tr>
            </thead>
            <tbody>
              {periods.map(p => {
                const school = schools.find(s => s._id === (p.schoolId || p.school?._id));
                return (
                  <tr key={p._id} style={{ borderBottom: "1px solid #f4f6fd" }}>
                    <Td>{school?.name ?? p.schoolName ?? "-"}</Td>
                    <Td>{p.name}</Td>
                    <Td>{p.type || "-"}</Td>
                    <Td>{p.start ? String(p.start).slice(0, 10) : "-"}</Td>
                    <Td>{p.end ? String(p.end).slice(0, 10) : "-"}</Td>
                    <Td>{p.note ?? "-"}</Td>
                    <Td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => handleEdit(p)} style={btn.light}>수정</button>
                        <button onClick={() => handleDelete(p._id)} style={btn.danger}>삭제</button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── presentational helpers ───────────────────────── */
function Th({ children }) {
  return <th style={{ padding: 10, borderBottom: "1px solid #eff3fa", textAlign: "left", color: "#475569", fontWeight: 700 }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: 10, color: "#0f172a", verticalAlign: "top" }}>{children}</td>;
}

const btn = {
  primary: { padding: "10px 14px", background: "#1677ff", color: "#fff", fontWeight: 700, border: 0, borderRadius: 10, cursor: "pointer" },
  success: { padding: "10px 14px", background: "#52c41a", color: "#fff", fontWeight: 700, border: 0, borderRadius: 10, cursor: "pointer" },
  light:   { padding: "8px 10px",  background: "#fff", color: "#0f172a", border: "1px solid #cfd8ea", borderRadius: 10, cursor: "pointer" },
  danger:  { padding: "8px 10px",  background: "#fff1f0", color: "#cf1322", border: "1px solid #ffccc7", borderRadius: 10, cursor: "pointer" },
  ghost:   { padding: "8px 12px",  background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer" }
};

const s = {
  cardHeader: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", marginBottom: 12,
    border: "1px solid #e7e9ef", borderRadius: 14,
    background: "linear-gradient(180deg, #f7faff 0%, #ffffff 100%)"
  },
  headerDot: {
    width: 10, height: 10, borderRadius: 9999,
    background: "#1677ff", boxShadow: "0 0 0 4px rgba(22,119,255,.12)"
  },
  h4: { margin: 0, color: "#0f172a", fontSize: 16, fontWeight: 800 },
  subtle: { color: "#64748b", fontSize: 12 },
  toolbar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  alertInfo: { padding: "8px 10px", background: "#f0f9ff", border: "1px solid #bae6fd", color: "#075985", borderRadius: 10 },
  card: { border: "1px solid #e8edf7", background: "#fff", borderRadius: 14, padding: 14, marginBottom: 14 },
  sectionTitleWrap: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionBar: { width: 6, height: 18, borderRadius: 4, background: "#1677ff" },
  sectionTitle: { fontWeight: 700, color: "#0f172a" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  input: { padding: "10px 12px", borderRadius: 10, border: "1px solid #cfd8ea", outline: "none", background: "#fff" }
};

export default SchoolPeriodManager;
