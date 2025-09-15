// client/src/components/Admin/AttendanceManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_URL } from "../../api";
import useAuthHeader from "../../utils/useAuthHeader";
import { toYmdLocal } from "../../utils/dateKST";

function RowEditor({ row, date, onSaved, auth }) {
  const [inTime, setInTime] = useState(row.checkIn || "");
  const [outTime, setOutTime] = useState(row.checkOut || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInTime(row.checkIn || "");
    setOutTime(row.checkOut || "");
  }, [row]);

  const save = async () => {
    try {
      setSaving(true);
      await axios.post(
        `${API_URL}/api/admin/attendance/set-times`,
        {
          studentId: row.userId || row.studentId,
          date,
          checkIn: inTime || "",
          checkOut: outTime || "",
          overwrite: true,
        },
        auth
      );
      onSaved?.();
    } catch (e) {
      alert(e?.response?.data?.message || "출결 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const badge =
    !row.checkIn && !row.checkOut
      ? { bg: "#fff3f3", fg: "#c22", label: "미체크" }
      : !row.checkOut
      ? { bg: "#fff8e6", fg: "#b75", label: "미하원" }
      : { bg: "#eef8ff", fg: "#246", label: "정상" };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr 0.9fr auto",
        gap: 8,
        alignItems: "center",
        padding: "10px 8px",
        borderBottom: "1px solid #eef2f8",
      }}
    >
      <div style={{ fontWeight: 700 }}>{row.studentName || row.name}</div>

      <input
        type="time"
        value={inTime}
        onChange={(e) => setInTime(e.target.value)}
        style={ipt}
      />
      <input
        type="time"
        value={outTime}
        onChange={(e) => setOutTime(e.target.value)}
        style={ipt}
      />

      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <span
          style={{
            alignSelf: "center",
            background: badge.bg,
            color: badge.fg,
            border: `1px solid ${badge.fg}30`,
            borderRadius: 999,
            padding: "3px 8px",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {badge.label}
        </span>
        <button onClick={save} disabled={saving} style={btnPrimary}>
          {saving ? "저장 중…" : "적용"}
        </button>
      </div>
    </div>
  );
}

export default function AttendanceManager() {
  const auth = useAuthHeader();

  const [tab, setTab] = useState("date"); // date | student (기존 유지)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const ymd = useMemo(() => toYmdLocal(selectedDate), [selectedDate]);

  // 좌측 달력 + 우측 당일 등원 리스트
  const [dayList, setDayList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 학생별 보기(기존 유지)
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    // 학생 목록 (학생별 보기에서 사용)
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/api/users?role=student`, auth)
      .then((res) =>
        setStudents(res.data.sort((a, b) => a.name.localeCompare(b.name, "ko")))
      )
      .catch(() => {});
  }, [auth]);

  // 날짜별 리스트
  const loadByDate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/attendance/by-date?date=${ymd}`,
        auth
      );
      // 기대 필드: userId, studentName, checkIn, checkOut
      setDayList(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      setDayList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "date") loadByDate();
    // eslint-disable-next-line
  }, [tab, ymd]);

  // 학생별 보기 데이터(최소 변경: 기존 구현 유지)
  const [studentMonthList, setStudentMonthList] = useState([]);
  const [monthCount, setMonthCount] = useState(0);
  const [month, setMonth] = useState(() => ymd.slice(0, 7));

  useEffect(() => {
    if (tab !== "student" || !selectedStudent) return;
    axios
      .get(
        `${API_URL}/api/attendance/by-student?userId=${selectedStudent}&month=${month}`,
        auth
      )
      .then((res) => {
        setStudentMonthList(res.data.records || []);
        setMonthCount(res.data.count || 0);
      })
      .catch(() => {
        setStudentMonthList([]);
        setMonthCount(0);
      });
  }, [tab, selectedStudent, month, auth]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e6e9f2",
        borderRadius: 14,
        padding: 16,
        margin: "0 auto",
      }}
    >
      <h2 style={{ margin: "6px 0 16px", textAlign: "center" }}>출결 관리</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          onClick={() => setTab("date")}
          style={tabBtn(tab === "date")}
        >
          날짜별 보기
        </button>
        <button
          onClick={() => setTab("student")}
          style={tabBtn(tab === "student")}
        >
          학생별 보기
        </button>
      </div>

      {tab === "date" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* 좌: 달력 */}
          <div
            style={{
              background: "#f9fbff",
              border: "1px solid #e6eefc",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="ko"
            />
            <div style={{ marginTop: 10, color: "#556" }}>
              선택 날짜: <b>{ymd}</b>
            </div>
          </div>

          {/* 우: 리스트 + 인라인 수정 */}
          <div
            style={{
              background: "#f9fbff",
              border: "1px solid #e6eefc",
              borderRadius: 12,
              padding: 12,
              minHeight: 300,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <b>당일 등원 학생</b>
              <button onClick={loadByDate} style={btnGhost}>
                새로고침
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#888" }}>불러오는 중…</div>
            ) : dayList.length === 0 ? (
              <div style={{ color: "#999" }}>등/하원 학생이 없습니다.</div>
            ) : (
              <div>
                {/* 헤더 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 0.9fr 0.9fr auto",
                    gap: 8,
                    padding: "8px 8px",
                    background: "#eef4ff",
                    borderRadius: 8,
                    fontWeight: 700,
                    color: "#234",
                    border: "1px solid #e1e9ff",
                  }}
                >
                  <div>학생</div>
                  <div>등원</div>
                  <div>하원</div>
                  <div style={{ textAlign: "right" }}>작업</div>
                </div>

                {/* 행들 */}
                <div>
                  {dayList
                    .sort((a, b) =>
                      (a.studentName || a.name || "").localeCompare(
                        b.studentName || b.name || "",
                        "ko"
                      )
                    )
                    .map((r) => (
                      <RowEditor
                        key={r.userId || r.studentId}
                        row={r}
                        date={ymd}
                        auth={auth}
                        onSaved={loadByDate}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "student" && (
        <div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={ipt}
            >
              <option value="">학생 선택</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={ipt}
            />
          </div>

          {selectedStudent && (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: "#246", marginBottom: 6 }}>
                등원횟수: <b>{monthCount}</b>
              </div>
              <ul style={{ margin: 0, padding: 0 }}>
                {studentMonthList.length === 0 ? (
                  <li style={{ color: "#999" }}>출결 기록이 없습니다.</li>
                ) : (
                  studentMonthList.map((a) => (
                    <li key={a.date} style={{ marginBottom: 6 }}>
                      {a.date} | 등원:{" "}
                      <span style={{ color: "#246" }}>
                        {a.checkIn || "-"}
                      </span>{" "}
                      | 하원:{" "}
                      <span style={{ color: "#824" }}>
                        {a.checkOut || "-"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ipt = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #ccd3e0",
  fontSize: 14,
  background: "#fff",
};

const btnPrimary = {
  padding: "7px 12px",
  borderRadius: 8,
  border: "none",
  background: "#226ad6",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const btnGhost = {
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid #ccd3e0",
  background: "#fff",
  color: "#246",
  fontWeight: 700,
  cursor: "pointer",
};

const tabBtn = (active) => ({
  padding: "9px 18px",
  borderRadius: 9,
  border: "none",
  background: active ? "#226ad6" : "#eef2f7",
  color: active ? "#fff" : "#234",
  fontWeight: 800,
  cursor: "pointer",
});
