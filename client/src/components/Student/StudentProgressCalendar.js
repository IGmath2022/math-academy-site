import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// props: progressList [{date: "YYYY-MM-DD", memo: "...", chapterId: ...}, ...]
//        chaptersMap { chapterId: { name, ... }, ... }
function StudentProgressCalendar({ progressList, chaptersMap }) {
  // 달력에 표시할 날짜 만들기
  const progressByDate = {};
  progressList.forEach(p => {
    progressByDate[p.date] = progressByDate[p.date] || [];
    progressByDate[p.date].push(p);
  });

  return (
    <div>
      <Calendar
        tileContent={({ date }) => {
          const d = date.toISOString().slice(0, 10);
          const arr = progressByDate[d];
          if (!arr) return null;
          // 여러개일 때 줄바꿈
          return (
            <ul style={{ margin: 0, padding: 0, fontSize: 11 }}>
              {arr.map((p, i) => (
                <li key={i} style={{ color: "#227ad6" }}>
                  {chaptersMap[p.chapterId]?.name || p.chapterId}
                  {p.memo && <> (<span style={{ color: "#888" }}>{p.memo}</span>)</>}
                </li>
              ))}
            </ul>
          );
        }}
      />
      <div style={{ marginTop: 18, fontSize: 13, color: "#888" }}>
        ● 진도 완료한 날에 강의명/메모가 표시됩니다.<br />
        ● 달력에 표시된 항목을 눌러도 기록 수정은 되지 않습니다.<br />
        ● 진도 기록은 “내 강의”에서 저장하세요.
      </div>
    </div>
  );
}

export default StudentProgressCalendar;