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
  const pageSize = 10;

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

  // 학생 전체 로딩
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users?role=student`, getAuth());
        setStudents((res.data || []).sort((a, b) => a.name.localeCompare(b.name, 'ko')));
      } catch (e) {
        if (e?.response?.status === 401) handle401();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜별 리스트 로딩
  useEffect(() => {
    if (tab !== "date") return;
    (async () => {
      try {
        const ymd = selectedDate.toISOString().slice(0, 10);
        const res = await axios.get(`${API_URL}/api/attendance/by-date?date=${ymd}`, getAuth());
        setDateList(res.data || []);
        setPage(1); // 날짜가 바뀌면 1페이지로
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
    <div style={wrap}>
      <div style={hdRow}>
        <h2 style={title}>출결 관리</h2>
        <div style={tabRow}>
          <button onClick={() => setTab("date")}
            style={{ ...tabBtn, ...(tab === "date" ? tabBtnOn : {}) }}>
            날짜별 보기
          </button>
          <button onClick={() => setTab("student")}
            style={{ ...tabBtn, ...(tab === "student" ? tabBtnOn : {}) }}>
            학생별 보기
          </button>
        </div>
      </div>

      {tab === "date" && (
        <div>
          <Calendar onChange={setSelectedDate} value={selectedDate} locale="ko" />
          <div style={{ marginTop: 22 }}>
            <div style={subTitle}>
              {selectedDate.toISOString().slice(0,10)} 출결 학생
              <span style={{ color: "#678", marginLeft: 6 }}>({dateList.length})</span>
            </div>
            <ul style={{ margin: 0, padding: 0 }}>
              {pagedDateList.length === 0 && <li style={{ color: "#999" }}>등/하원 학생 없음</li>}
              {pagedDateList.map(a =>
                <li key={a.userId} style={{ margin: "9px 0", fontSize: 15 }}>
                  <b>{a.studentName}</b>
                  <span style={{ marginLeft: 8 }}>
                    등원: <span style={{ color: "#246", fontWeight: 700 }}>{a.checkIn || "-"}</span>
                    {"  /  "}
                    하원: <span style={{ color: "#824", fontWeight: 700 }}>{a.checkOut || "-"}</span>
                  </span>
                </li>
              )}
            </ul>
            {totalPages > 1 && (
              <div style={{ margin: "12px 0 0 0", textAlign: "center" }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    style={{
                      margin: 2,
                      padding: "6px 13px",
                      borderRadius: 8,
                      border: "none",
                      background: i + 1 === page ? "#226ad6" : "#edf0f6",
                      color: i + 1 === page ? "#fff" : "#445",
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
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={label}>학생</span>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              style={ipt}
            >
              <option value="">학생 선택</option>
              {students.map(s =>
                <option value={s._id} key={s._id}>{s.name}</option>
              )}
            </select>
          </label>

          {selectedStudent && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setMonth(prev => {
                    const d = new Date(prev + "-01");
                    d.setMonth(d.getMonth() - 1);
                    return d.toISOString().slice(0,7);
                  })}
                  style={btnGhost}
                >
                  ◀ 이전달
                </button>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{month}</span>
                <button
                  onClick={() => setMonth(prev => {
                    const d = new Date(prev + "-01");
                    d.setMonth(d.getMonth() + 1);
                    return d.toISOString().slice(0,7);
                  })}
                  style={btnGhost}
                >
                  다음달 ▶
                </button>
                <span style={{ marginLeft: 8, color: "#246" }}>
                  등원횟수: <b>{monthCount}</b>
                </span>
              </div>

              <ul style={{ margin: "12px 0 0 0", padding: 0 }}>
                {studentMonthList.length === 0 && <li style={{ color: "#999" }}>출결 기록 없음</li>}
                {studentMonthList.map(a =>
                  <li key={a.date} style={{ marginBottom: 8, fontSize: 15 }}>
                    {a.date} — 등원: <span style={{ color: "#246", fontWeight: 700 }}>{a.checkIn || "-"}</span>
                    {"  /  "}
                    하원: <span style={{ color: "#824", fontWeight: 700 }}>{a.checkOut || "-"}</span>
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

const hdRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };
const title = { margin: 0, fontSize: 20 };
const tabRow = { display: "flex", gap: 8, flexWrap: "wrap" };
const tabBtn = { padding: "8px 14px", borderRadius: 9, border: "1px solid #dfe5f2", background: "#f7f9ff", fontWeight: 700, cursor: "pointer" };
const tabBtnOn = { background: "#226ad6", color: "#fff", border: "none" };
const subTitle = { fontSize: 17, fontWeight: 800, margin: "12px 0" };
const label = { display: "block", fontSize: 13, color: "#556", fontWeight: 700, marginBottom: 6 };
const ipt = { width: "100%", maxWidth: 360, padding: "10px 12px", borderRadius: 9, border: "1px solid #ccd3e0", fontSize: 15, boxSizing: "border-box" };
const btnGhost = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ccd3e0", background: "#fff", color: "#246", fontWeight: 700, cursor: "pointer" };

export default AttendanceManager;
