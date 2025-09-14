import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_URL } from '../../api';
import { getToken } from "../../utils/auth";

function getYYYYMM(date) {
  return date.toISOString().slice(0,7);
}

function AttendanceManager() {
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

  // 학생 전체 로딩
  useEffect(() => {
    const token = getToken();
    axios.get(`${API_URL}/api/users?role=student`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStudents(res.data.sort((a, b) => a.name.localeCompare(b.name))));
  }, []);

  // 날짜별 리스트 로딩
  useEffect(() => {
    if (tab !== "date") return;
    const ymd = selectedDate.toISOString().slice(0, 10);
    axios.get(`${API_URL}/api/attendance/by-date?date=${ymd}`)
      .then(res => {
        setDateList(res.data);
        setPage(1); // 날짜가 바뀌면 1페이지로
      });
  }, [tab, selectedDate]);

  // 학생별 리스트 로딩 (userId로 통일)
  useEffect(() => {
    if (tab !== "student" || !selectedStudent) return;
    axios.get(`${API_URL}/api/attendance/by-student?userId=${selectedStudent}&month=${month}`)
      .then(res => {
        setStudentMonthList(res.data.records);
        setMonthCount(res.data.count);
      });
  }, [tab, selectedStudent, month]);

  // 날짜별 출결 학생 페이지네이션
  const totalPages = Math.ceil(dateList.length / pageSize);
  const pagedDateList = dateList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{
      maxWidth: 700, margin: "32px auto", background: "#fff",
      borderRadius: 16, boxShadow: "0 2px 18px #0001", padding: 32
    }}>
      <h2 style={{ marginBottom: 22, textAlign: "center" }}>출결 관리</h2>
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        <button onClick={() => setTab("date")}
          style={{ background: tab === "date" ? "#226ad6" : "#eee", color: tab === "date" ? "#fff" : "#222", fontWeight: 600, border: "none", borderRadius: 7, padding: "9px 23px" }}>
          날짜별 보기
        </button>
        <button onClick={() => setTab("student")}
          style={{ background: tab === "student" ? "#226ad6" : "#eee", color: tab === "student" ? "#fff" : "#222", fontWeight: 600, border: "none", borderRadius: 7, padding: "9px 23px" }}>
          학생별 보기
        </button>
      </div>

      {tab === "date" && (
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="ko"
          />
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
            {/* 페이지네이션 버튼 */}
            {totalPages > 1 && (
              <div style={{ margin: "10px 0 0 0", textAlign: "center" }}>
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
          </div>
        </div>
      )}

      {tab === "student" && (
        <div>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ fontSize: 17, padding: "7px 13px", borderRadius: 7 }}>
            <option value="">학생 선택</option>
            {students.map(s =>
              <option value={s._id} key={s._id}>{s.name}</option>
            )}
          </select>
          {selectedStudent && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setMonth(prev => {
                  const d = new Date(prev + "-01");
                  d.setMonth(d.getMonth() - 1);
                  return d.toISOString().slice(0,7);
                })}>◀ 이전달</button>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{month}</span>
                <button onClick={() => setMonth(prev => {
                  const d = new Date(prev + "-01");
                  d.setMonth(d.getMonth() + 1);
                  return d.toISOString().slice(0,7);
                })}>다음달 ▶</button>
                <span style={{ marginLeft: 16, color: "#246" }}>등원횟수: <b>{monthCount}</b></span>
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
