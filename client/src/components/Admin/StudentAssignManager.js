import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../../api';
import { getToken } from "../../utils/auth";

function StudentAssignManager({ chapterList }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedStudent) fetchAssigned();
    // eslint-disable-next-line
  }, [selectedStudent, refresh]);

  const fetchStudents = async () => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/api/users?role=student`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStudents(res.data);
  };

  // 핵심: chapterId가 객체이든 문자열이든 무조건 id만 배열에 담는다!
  const fetchAssigned = async () => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/api/assignments`, {
      params: { userId: selectedStudent._id },
      headers: { Authorization: `Bearer ${token}` }
    });
    setAssigned(
      res.data.map(a => String(a.chapterId?._id || a.chapterId))
    );
  };

  // 강의 할당
  const handleAssign = async (chapterId) => {
    try {
      const token = getToken();
      await axios.post(`${API_URL}/api/assignments`,
        { userId: selectedStudent._id, chapterId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefresh(r => !r);
    } catch (e) {
      if (e.response?.status === 409) {
        alert("이미 할당된 강의입니다.");
      } else {
        alert("할당 오류: " + (e.message || "알 수 없는 오류"));
      }
    }
  };

  // 할당 해제
  const handleUnassign = async (chapterId) => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/api/assignments`, {
      params: { userId: selectedStudent._id },
      headers: { Authorization: `Bearer ${token}` }
    });
    const found = res.data.find(a => 
      String(a.chapterId?._id || a.chapterId) === String(chapterId)
    );
    if (found) {
      await axios.delete(`${API_URL}/api/assignments/${found._id}`, {
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
          value={selectedStudent?._id || ""}
          onChange={e => {
            const stu = students.find(s => String(s._id) === e.target.value);
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
            <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
          )}
        </select>
      </div>
      {selectedStudent && (
        <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
          {chapterList.map(c => (
            <li
              key={c._id}
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
              {assigned.includes(String(c._id))
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
                    onClick={() => handleUnassign(c._id)}
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
                    onClick={() => handleAssign(c._id)}
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
