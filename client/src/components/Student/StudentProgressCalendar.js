import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// props: progressList [{date: "YYYY-MM-DD", memo: "...", chapterId: ...}, ...]
//        chaptersMap { chapterId: { name, ... }, ... }
//        attendanceList [{date: "YYYY-MM-DD", course: "...", content: "...", teacher: "..."}, ...]
function StudentProgressCalendar({ progressList, chaptersMap, attendanceList = [] }) {
  // 달력에 표시할 날짜 만들기 - 온라인 진도와 현강 데이터 통합
  const eventsByDate = {};

  // 온라인 진도 데이터 추가
  progressList.forEach(p => {
    eventsByDate[p.date] = eventsByDate[p.date] || [];
    eventsByDate[p.date].push({
      type: 'online',
      title: chaptersMap[p.chapterId]?.name || p.chapterId,
      memo: p.memo,
      color: "#1d4ed8" // 파란색 (인강)
    });
  });

  // 현강 데이터 추가
  attendanceList.forEach(a => {
    eventsByDate[a.date] = eventsByDate[a.date] || [];
    eventsByDate[a.date].push({
      type: 'attendance',
      title: a.course || '수업',
      memo: a.content,
      teacher: a.teacher,
      color: "#059669" // 초록색 (현강)
    });
  });

  return (
    <div>
      <Calendar
        tileContent={({ date }) => {
          const d = date.toISOString().slice(0, 10);
          const events = eventsByDate[d];
          if (!events) return null;

          return (
            <ul style={{ margin: 0, padding: 0, fontSize: 10, lineHeight: 1.2 }}>
              {events.map((event, i) => (
                <li key={i} style={{
                  color: event.color,
                  marginBottom: 1,
                  listStyle: 'none'
                }}>
                  <div style={{ fontWeight: '600' }}>
                    {event.type === 'online' ? '인강' : '현강'}: {event.title}
                  </div>
                  {event.memo && (
                    <div style={{ color: "#666", fontSize: 9 }}>
                      {event.memo}
                    </div>
                  )}
                  {event.teacher && (
                    <div style={{ color: "#666", fontSize: 9 }}>
                      ({event.teacher})
                    </div>
                  )}
                </li>
              ))}
            </ul>
          );
        }}
      />
      <div style={{ marginTop: 18, fontSize: 13, color: "#888" }}>
        ● <span style={{ color: "#1d4ed8", fontWeight: 'bold' }}>인강</span>: 온라인 진도 완료 기록<br />
        ● <span style={{ color: "#059669", fontWeight: 'bold' }}>현강</span>: 현장 수업 기록<br />
        ● 달력에 표시된 항목을 눌러도 기록 수정은 되지 않습니다.<br />
        ● 진도 기록은 "내 강의"에서 저장하세요.
      </div>
    </div>
  );
}

export default StudentProgressCalendar;