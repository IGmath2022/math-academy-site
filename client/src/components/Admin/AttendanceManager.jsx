import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_URL } from '../../api';
import { useNavigate } from "react-router-dom";

function getYYYYMM(date) {
  return date.toISOString().slice(0,7);
}

function AttendanceManager() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("date");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState([]);
  const [dateList, setDateList] = useState([]);
  const [studentMonthList, setStudentMonthList] = useState([]);
  const [month, setMonth] = useState(getYYYYMM(new Date()));
  const [monthCount, setMonthCount] = useState(0);

  // 페이지네이션 state (날짜별 보기)
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // 공통: Authorization 헤더/401 처리
  const getAuth = () => {
    const token = localStorage.getItem("token") || "";
    return { headers: { Authorization: `Bearer ${token}` } };
  };
  const handle401 = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  // 학생 전체 로딩
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users?role=student`, getAuth());
        const rows = (res.data || []).sort((a, b) => a.name.localeCompare(b.name, "ko"));
        setStudents(rows);
      } catch (e) {
        if (e?.response?.status === 401) handle401();
        else setStudents([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜별 리스트 로딩
  useEffect(() => {
    if (tab !== "date") return;
    (async () => {
      const ymd = selectedDate.toISOString().slice(0, 10);
      try {
        const res = await axios.get(`${API_URL}/api/attendance/by-date?date=${ymd}`, getAuth());
        setDateList(res.data || []);
        setPage(1); // 날짜 바뀌면 1페이지
      } catch (e) {
        if (e?.response?.status === 401) handle401();
        else setDateList([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedDate]);

  // 학생별 리스트 로딩 (userId로 통일)
  useEffect(() => {
    if (tab !== "student" || !selectedStudent) return;
    (async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/attendance/by-student?userId=${selectedStudent}&month=${month}`,
          getAuth()
        );
        setStudentMonthList(res.data?.records || []);
        setMonthCount(res.data?.count || 0);
      } catch (e) {
        if (e?.response?.status === 401) handle401();
        else {
          setStudentMonthList([]);
          setMonthCount(0);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedStudent, month]);

  // 날짜별 출결 학생 페이지네이션
  const totalPages = Math.ceil(dateList.length / pageSize);
  const pagedDateList = dateList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{
      width: "100%",
      maxWidth: 900,
      margin: "18px auto",
      background: "#fff",
      border: "1px solid #e6e9f2",
      borderRadius: 14,
      padding: 18,
      boxShadow: "0 2px 18px #0001",
    }}>
      <h2 style={{ marginBottom: 22, textAlign: "center" }}>출결 관리</h2>

      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("date")}
          style={{
            background: tab === "date" ? "#226ad6" : "#eee",
            color: tab === "date" ? "#fff" : "#222",
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: "pointer"
          }}
        >
          날짜별 보기
        </button>
        <button
          onClick={() => setTab("student")}
          style={{
            background: tab === "student" ? "#226ad6" : "#eee",
            color: tab === "student" ? "#fff" : "#222",
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: "pointer"
          }}
        >
          학생별 보기
        </button>
      </div>

      {tab === "date" && (
        <div>
          <Calendar onChange={setSelectedDate} value={selectedDate} locale="ko" />
          <div style={{ marginTop: 26 }}>
            <h4>{selectedDate.toISOString().slice(0,10)} 출결 학생 ({dateList.length})</h4>
            <ul style={{ margin: 0, padding: 0 }}>
              {pagedDateList.length === 0 && <li style={{ color: "#999" }}>등/하원 학생 없음</li>}
              {pagedDateList.map(a =>
                <li key={a.userId} style={{ margin: "9px 0" }}>
                  <b>{a.studentName}</b> | 등원: <span style={{ color: "#246" }}>{a.checkIn || "-"}</span> | 하원: <span style={{ color: "#824" }}>{a.checkOut || "-"}</span>
                </li>
              )}
            </ul>
            {totalPages > 1 && (
              <div style={{ margin: "10px 0 0 0", textAlign: "center" }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    style={{
                      margin: 2,
                      padding: "6px 12px",
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
          </div>
        </div>
      )}

      {tab === "student" && (
        <div>
          <select
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "10px 12px",
              borderRadius: 9,
              border: "1px solid #ccd3e0",
              fontSize: 15,
              boxSizing: "border-box"
            }}
          >
            <option value="">학생 선택</option>
            {students.map(s =>
              <option value={s._id} key={s._id}>{s.name}</option>
            )}
          </select>

          {selectedStudent && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => {
                  const d = new Date(month + "-01");
                  d.setMonth(d.getMonth() - 1);
                  setMonth(d.toISOString().slice(0,7));
                }}>◀ 이전달</button>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{month}</span>
                <button onClick={() => {
                  const d = new Date(month + "-01");
                  d.setMonth(d.getMonth() + 1);
                  setMonth(d.toISOString().slice(0,7));
                }}>다음달 ▶</button>
                <span style={{ marginLeft: 16, color: "#246" }}>
                  등원횟수: <b>{monthCount}</b>
                </span>
              </div>
              <ul style={{ margin: "12px 0 0 0", padding: 0 }}>
                {studentMonthList.length === 0 && <li style={{ color: "#999" }}>출결 기록 없음</li>}
                {studentMonthList.map(a =>
                  <li key={a.date} style={{ marginBottom: 6 }}>
                    {a.date} | 등원: <span style={{ color: "#246" }}>{a.checkIn || "-"}</span> | 하원: <span style={{ color: "#824" }}>{a.checkOut || "-"}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceManager;
