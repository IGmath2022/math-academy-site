import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';
import { useNavigate } from "react-router-dom";

function StudentAssignManager({ chapterList }) {
  const [students, setStudents] = useState([]);
  the [selectedStudent, setSelectedStudent] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const navigate = useNavigate();

  const getAuth = () => {
    const token = localStorage.getItem("token") || "";
    return { headers: { Authorization: `Bearer ${token}` } };
  };
  const handle401 = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedStudent) fetchAssigned();
    // eslint-disable-next-line
  }, [selectedStudent, refresh]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users?role=student`, getAuth());
      setStudents(res.data || []);
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else setStudents([]);
    }
  };

  const fetchAssigned = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/assignments`, {
        params: { userId: selectedStudent._id },
        ...getAuth()
      });
      setAssigned(
        (res.data || []).map(a => String(a.chapterId?._id || a.chapterId))
      );
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else setAssigned([]);
    }
  };

  const handleAssign = async (chapterId) => {
    try {
      await axios.post(`${API_URL}/api/assignments`,
        { userId: selectedStudent._id, chapterId },
        getAuth()
      );
      setRefresh(r => !r);
    } catch (e) {
      if (e?.response?.status === 401) return handle401();
      if (e?.response?.status === 409) {
        alert("이미 할당된 강의입니다.");
      } else {
        alert("할당 오류");
      }
    }
  };

  const handleUnassign = async (chapterId) => {
    try {
      const res = await axios.get(`${API_URL}/api/assignments`, {
        params: { userId: selectedStudent._id },
        ...getAuth()
      });
      const found = (res.data || []).find(a =>
        String(a.chapterId?._id || a.chapterId) === String(chapterId)
      );
      if (found) {
        await axios.delete(`${API_URL}/api/assignments/${found._id}`, getAuth());
        setRefresh(r => !r);
      }
    } catch (e) {
      if (e?.response?.status === 401) handle401();
      else alert("해제 오류");
    }
  };

  return (
    <div style={wrap}>
      <h4 style={title}>학생별 강의 할당</h4>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block" }}>
          <span style={label}>학생</span>
          <select
            value={selectedStudent?._id || ""}
            onChange={e => {
              const stu = students.find(s => String(s._id) === e.target.value);
              setSelectedStudent(stu || null);
            }}
            style={ipt}
          >
            <option value="">학생 선택</option>
            {students.map(s =>
              <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
            )}
          </select>
        </label>
      </div>

      {selectedStudent && (
        <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
          {chapterList.map(c => {
            const isAssigned = assigned.includes(String(c._id));
            return (
              <li key={c._id} style={rowItem}>
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 15 }}>{c.name}</b>
                  <span style={{ color: "#888", marginLeft: 7, fontSize: 14 }}>{c.description}</span>
                </div>
                {isAssigned ? (
                  <button style={btnDanger} onClick={() => handleUnassign(c._id)}>할당 해제</button>
                ) : (
                  <button style={btnLink} onClick={() => handleAssign(c._id)}>할당</button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!selectedStudent && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 12 }}>
          학생을 먼저 선택하세요.
        </div>
      )}
      {selectedStudent && chapterList.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 12 }}>
          단원이 없습니다.
        </div>
      )}
    </div>
  );
}

const wrap = {
  width: "100%",
  maxWidth: 900,
  margin: "18px auto",
  background: "#fff",
  border: "1px solid #e6e9f2",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 2px 18px #0001",
};
const title = { marginTop: 0, marginBottom: 12, fontSize: 18 };
const label = { display: "block", fontSize: 13, color: "#556", fontWeight: 700, marginBottom: 6 };
const ipt = { width: "100%", maxWidth: 360, padding: "10px 12px", borderRadius: 9, border: "1px solid #ccd3e0", fontSize: 15, boxSizing: "border-box" };
const rowItem = { marginBottom: 10, padding: "10px 0", borderBottom: "1px solid #eef1f6", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const btnDanger = { marginLeft: "auto", padding: "7px 14px", fontSize: 14, borderRadius: 8, border: "none", background: "#fae5e5", color: "#c22", cursor: "pointer", fontWeight: 600 };
const btnLink = { marginLeft: "auto", padding: "7px 14px", fontSize: 14, borderRadius: 8, border: "none", background: "#e9f3ff", color: "#226ad6", cursor: "pointer", fontWeight: 600 };

export default StudentAssignManager;
