import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

const ipt = { padding: "9px 12px", borderRadius: 10, border: "1px solid #d8dfeb", fontSize: 14, width: "100%" };
const btn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #d8dfeb", background: "#fff", cursor: "pointer", fontWeight: 700 };
const btnAssign = { ...btn, background: "#eef6ff", borderColor: "#d2e6ff", color: "#226ad6" };
const btnRemove = { ...btn, background: "#fff5f5", borderColor: "#f2caca", color: "#c22" };
const th = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #eef2f7", fontSize: 14, color: "#455" };
const td = { padding: "10px 10px", borderBottom: "1px solid #f3f5fb", fontSize: 14, color: "#223" };

function StudentAssignManager({ chapterList }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedStudent) fetchAssigned();
    // eslint-disable-next-line
  }, [selectedStudent, refresh]);

  const fetchStudents = async () => {
    const res = await axios.get(`${API_URL}/api/users?role=student`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStudents(res.data);
  };

  const fetchAssigned = async () => {
    const res = await axios.get(`${API_URL}/api/assignments`, {
      params: { userId: selectedStudent._id },
      headers: { Authorization: `Bearer ${token}` },
    });
    setAssigned(res.data.map((a) => String(a.chapterId?._id || a.chapterId)));
  };

  const handleAssign = async (chapterId) => {
    try {
      await axios.post(
        `${API_URL}/api/assignments`,
        { userId: selectedStudent._id, chapterId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefresh((r) => !r);
    } catch (e) {
      if (e.response?.status === 409) alert("이미 할당된 강의입니다.");
      else alert("할당 오류: " + (e.message || "알 수 없는 오류"));
    }
  };

  const handleUnassign = async (chapterId) => {
    const res = await axios.get(`${API_URL}/api/assignments`, {
      params: { userId: selectedStudent._id },
      headers: { Authorization: `Bearer ${token}` },
    });
    const found = res.data.find((a) => String(a.chapterId?._id || a.chapterId) === String(chapterId));
    if (found) {
      await axios.delete(`${API_URL}/api/assignments/${found._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefresh((r) => !r);
    }
  };

  return (
    <div>
      {/* 학생 선택 */}
      <div style={{ marginBottom: 12, maxWidth: 420 }}>
        <select
          value={selectedStudent?._id || ""}
          onChange={(e) => {
            const stu = students.find((s) => String(s._id) === e.target.value);
            setSelectedStudent(stu || null);
          }}
          style={ipt}
        >
          <option value="">학생 선택</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
      </div>

      {/* 리스트 */}
      {selectedStudent ? (
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e8edf6", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f7f9ff" }}>
                <th style={th} width="26%">단원명</th>
                <th style={th}>설명</th>
                <th style={{ ...th, textAlign: "right" }} width="160">할당</th>
              </tr>
            </thead>
            <tbody>
              {chapterList.map((c) => {
                const isAssigned = assigned.includes(String(c._id));
                return (
                  <tr key={c._id}>
                    <td style={td}><b>{c.name}</b></td>
                    <td style={{ ...td, color: "#566" }}>{c.description}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {isAssigned ? (
                        <button style={btnRemove} onClick={() => handleUnassign(c._id)}>
                          할당 해제
                        </button>
                      ) : (
                        <button style={btnAssign} onClick={() => handleAssign(c._id)}>
                          할당
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {chapterList.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ ...td, color: "#777", textAlign: "center" }}>
                    단원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: "#777" }}>학생을 먼저 선택하세요.</div>
      )}
    </div>
  );
}

export default StudentAssignManager;
