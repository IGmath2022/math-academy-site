import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';

function StudentAssignManager({ chapterList }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const token = localStorage.getItem("token");

  // 학생 목록 불러오기
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedStudent) fetchAssigned();
    // eslint-disable-next-line
  }, [selectedStudent, refresh]);

  const fetchStudents = async () => {
    const res = await axios.get("${API_URL}/api/users?role=student", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStudents(res.data);
  };

  const fetchAssigned = async () => {
    const res = await axios.get("${API_URL}/api/assignments", {
      params: { userId: selectedStudent.id },
      headers: { Authorization: `Bearer ${token}` }
    });
    setAssigned(res.data.map(a => a.Chapter?.id));
  };

  // 학생에게 단원(강의) 할당
  const handleAssign = async (chapterId) => {
    await axios.post("${API_URL}/api/assignments",
      { userId: selectedStudent.id, chapterId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRefresh(r => !r);
  };

  // 할당 해제
  const handleUnassign = async (chapterId) => {
    const res = await axios.get("${API_URL}/api/assignments", {
      params: { userId: selectedStudent.id },
      headers: { Authorization: `Bearer ${token}` }
    });
    const found = res.data.find(a => a.Chapter?.id === chapterId);
    if (found) {
      await axios.delete(`${API_URL}/api/assignments/${found.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRefresh(r => !r);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e8ec",
        background: "#f8fafd",
        borderRadius: 12,
        padding: "22px 13px",
        marginTop: 18,
        boxShadow: "0 2px 6px #0001",
        maxWidth: 440,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 22,
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: 17, fontSize: 17 }}>학생별 강의 할당</h4>
      <div style={{ marginBottom: 14 }}>
        <select
          value={selectedStudent?.id || ""}
          onChange={e => {
            const stu = students.find(s => String(s.id) === e.target.value);
            setSelectedStudent(stu);
          }}
          style={{
            width: "100%",
            maxWidth: 300,
            padding: "11px 10px",
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #ddd"
          }}
        >
          <option value="">학생 선택</option>
          {students.map(s =>
            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
          )}
        </select>
      </div>
      {selectedStudent && (
        <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
          {chapterList.map(c => (
            <li
              key={c.id}
              style={{
                marginBottom: 12,
                padding: "10px 0",
                borderBottom: "1px solid #eaeaea",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              <b style={{ fontSize: 15 }}>{c.name}</b>
              <span style={{ color: "#888", marginLeft: 7, fontSize: 14 }}>
                {c.description}
              </span>
              {assigned.includes(c.id)
                ? (
                  <button
                    style={{
                      marginLeft: "auto",
                      padding: "7px 14px",
                      fontSize: 14,
                      borderRadius: 7,
                      border: "none",
                      background: "#fae5e5",
                      color: "#c22",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => handleUnassign(c.id)}
                  >
                    할당 해제
                  </button>
                )
                : (
                  <button
                    style={{
                      marginLeft: "auto",
                      padding: "7px 14px",
                      fontSize: 14,
                      borderRadius: 7,
                      border: "none",
                      background: "#e9f3ff",
                      color: "#226ad6",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => handleAssign(c.id)}
                  >
                    할당
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
      {selectedStudent && chapterList.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 18 }}>
          단원이 없습니다.
        </div>
      )}
      {!selectedStudent && (
        <div style={{ color: "#888", textAlign: "center", marginTop: 18 }}>
          학생을 먼저 선택하세요.
        </div>
      )}
    </div>
  );
}

export default StudentAssignManager;