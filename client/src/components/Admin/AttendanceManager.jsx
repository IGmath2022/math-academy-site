import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_URL } from "../../api";

function getYYYYMM(date) {
  return date.toISOString().slice(0, 7);
}

const ipt = { padding: "9px 12px", borderRadius: 10, border: "1px solid #d8dfeb", fontSize: 14 };
const btn = {
  padding: "9px 14px",
  borderRadius: 10,
  border: "1px solid #d8dfeb",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};
const btnPrimary = { ...btn, background: "#226ad6", color: "#fff", border: "none" };
const th = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #eef2f7", fontSize: 14, color: "#455" };
const td = { padding: "10px 10px", borderBottom: "1px solid #f3f5fb", fontSize: 14, color: "#223" };
const pill = (active) => ({
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid " + (active ? "#226ad6" : "#d8dfeb"),
  background: active ? "#226ad6" : "#fff",
  color: active ? "#fff" : "#223",
  fontWeight: 700,
  cursor: "pointer",
});

function AttendanceManager() {
  const [tab, setTab] = useState("date");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState([]);
  const [dateList, setDateList] = useState([]);
  const [studentMonthList, setStudentMonthList] = useState([]);
  const [month, setMonth] = useState(getYYYYMM(new Date()));
  const [monthCount, setMonthCount] = useState(0);

  // 페이지네이션 (날짜별 보기)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 학생 전체 로딩
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/users?role=student`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStudents(res.data.sort((a, b) => a.name.localeCompare(b.name, "ko"))));
  }, []);

  // 날짜별 리스트
  useEffect(() => {
    if (tab !== "date") return;
    const ymd = selectedDate.toISOString().slice(0, 10);
    axios.get(`${API_URL}/api/attendance/by-date?date=${ymd}`).then((res) => {
      setDateList(res.data);
      setPage(1);
    });
  }, [tab, selectedDate]);

  // 학생별 리스트 (userId 기준)
  useEffect(() => {
    if (tab !== "student" || !selectedStudent) return;
    axios.get(`${API_URL}/api/attendance/by-student?userId=${selectedStudent}&month=${month}`).then((res) => {
      setStudentMonthList(res.data.records);
      setMonthCount(res.data.count);
    });
  }, [tab, selectedStudent, month]);

  // 페이지네이션
  const totalPages = Math.ceil(dateList.length / pageSize);
  const pagedDateList = dateList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* 탭 스위치 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setTab("date")} style={pill(tab === "date")}>
          날짜별 보기
        </button>
        <button onClick={() => setTab("student")} style={pill(tab === "student")}>
          학생별 보기
        </button>
      </div>

      {tab === "date" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e8edf6", borderRadius: 12, padding: 12 }}>
            <Calendar onChange={setSelectedDate} value={selectedDate} locale="ko" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "#223", marginBottom: 10 }}>
              {selectedDate.toISOString().slice(0, 10)} 출결 학생 ({dateList.length})
            </div>
            <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e8edf6", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f7f9ff" }}>
                    <th style={th}>학생</th>
                    <th style={th}>등원</th>
                    <th style={th}>하원</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedDateList.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...td, color: "#777", textAlign: "center" }}>
                        등/하원 학생 없음
                      </td>
                    </tr>
                  )}
                  {pagedDateList.map((a) => (
                    <tr key={a.userId}>
                      <td style={td}>{a.studentName}</td>
                      <td style={{ ...td, color: "#246" }}>{a.checkIn || "-"}</td>
                      <td style={{ ...td, color: "#824" }}>{a.checkOut || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid " + (i + 1 === page ? "#226ad6" : "#d8dfeb"),
                      background: i + 1 === page ? "#226ad6" : "#fff",
                      color: i + 1 === page ? "#fff" : "#223",
                      fontWeight: 800,
                      cursor: "pointer",
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
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{ ...ipt, minWidth: 220 }}
            >
              <option value="">학생 선택</option>
              {students.map((s) => (
                <option value={s._id} key={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            {selectedStudent && (
              <>
                <button
                  onClick={() =>
                    setMonth((prev) => {
                      const d = new Date(prev + "-01");
                      d.setMonth(d.getMonth() - 1);
                      return d.toISOString().slice(0, 7);
                    })
                  }
                  style={btn}
                >
                  ◀ 이전달
                </button>
                <span style={{ fontWeight: 800, color: "#223" }}>{month}</span>
                <button
                  onClick={() =>
                    setMonth((prev) => {
                      const d = new Date(prev + "-01");
                      d.setMonth(d.getMonth() + 1);
                      return d.toISOString().slice(0, 7);
                    })
                  }
                  style={btn}
                >
                  다음달 ▶
                </button>
                <span style={{ marginLeft: 8, color: "#246" }}>
                  등원횟수: <b>{monthCount}</b>
                </span>
              </>
            )}
          </div>

          {selectedStudent && (
            <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e8edf6", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f7f9ff" }}>
                    <th style={th}>날짜</th>
                    <th style={th}>등원</th>
                    <th style={th}>하원</th>
                  </tr>
                </thead>
                <tbody>
                  {studentMonthList.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...td, textAlign: "center", color: "#777" }}>
                        출결 기록 없음
                      </td>
                    </tr>
                  )}
                  {studentMonthList.map((a) => (
                    <tr key={a.date}>
                      <td style={td}>{a.date}</td>
                      <td style={{ ...td, color: "#246" }}>{a.checkIn || "-"}</td>
                      <td style={{ ...td, color: "#824" }}>{a.checkOut || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!selectedStudent && <div style={{ color: "#777" }}>학생을 선택하세요.</div>}
        </div>
      )}
    </div>
  );
}

export default AttendanceManager;
