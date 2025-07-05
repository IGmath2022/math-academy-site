import React, { useEffect, useState } from "react";
import Calendar from "react-calendar"; // npm install react-calendar
import "react-calendar/dist/Calendar.css";
import axios from "axios";

function StudentProgressCalendar({ userId, chapters = [] }) {
  const [progressList, setProgressList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    axios
      .get(`/api/progress?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProgressList(res.data));
  }, [userId]);

  // 날짜별 진도
  function progressOnDate(date) {
    const ymd = date.toISOString().slice(0, 10);
    return progressList.filter((p) => p.date === ymd);
  }
  // 챕터명
  const getChapterName = id =>
    chapters.find(c => c.id === id)?.name || id;

  return (
    <div style={{ margin: "18px 0" }}>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={({ date }) => {
          const list = progressOnDate(date);
          if (list.length === 0) return null;
          return (
            <span style={{ color: "#226ad6", fontWeight: "bold" }}>•</span>
          );
        }}
      />
      {selectedDate && (
        <div style={{ marginTop: 16 }}>
          <b>{selectedDate.toISOString().slice(0, 10)} 진도 기록</b>
          <ul style={{ fontSize: 15, margin: 0, padding: 0 }}>
            {progressOnDate(selectedDate).length === 0 ? (
              <li style={{ color: "#888" }}>기록 없음</li>
            ) : (
              progressOnDate(selectedDate).map((p) => (
                <li key={p.id} style={{ marginBottom: 4 }}>
                  <b>{getChapterName(p.chapterId)}</b>
                  {p.memo && <span style={{ color: "#444" }}> — {p.memo}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StudentProgressCalendar;