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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>
        {`
          .react-calendar {
            width: 100% !important;
            max-width: none !important;
            font-family: inherit !important;
            border: 1px solid #e8edf3 !important;
            border-radius: 12px !important;
            background: white !important;
          }
          .react-calendar__tile {
            height: 80px !important;
            max-height: 80px !important;
            padding: 4px !important;
            position: relative !important;
            vertical-align: top !important;
            overflow: hidden !important;
            border: 1px solid #f1f5f9 !important;
          }
          .react-calendar__tile:hover {
            background-color: #f8fafc !important;
          }
          .react-calendar__tile--active {
            background: #e0f2fe !important;
            color: #0c4a6e !important;
          }
          .react-calendar__tile--now {
            background: #fef3c7 !important;
            color: #92400e !important;
          }
          .react-calendar__month-view__days__day--weekend {
            color: #dc2626 !important;
          }
          .calendar-event-container {
            position: absolute;
            top: 18px;
            left: 2px;
            right: 2px;
            bottom: 2px;
            overflow: hidden;
          }
          .calendar-event-item {
            font-size: 8px;
            line-height: 1.1;
            margin-bottom: 1px;
            padding: 1px 2px;
            border-radius: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            background: rgba(255, 255, 255, 0.9);
          }
          .calendar-event-online {
            border-left: 2px solid #1d4ed8;
            color: #1d4ed8 !important;
          }
          .calendar-event-attendance {
            border-left: 2px solid #059669;
            color: #059669 !important;
          }
          .calendar-more-indicator {
            font-size: 7px;
            color: #64748b;
            text-align: center;
            background: rgba(100, 116, 139, 0.1);
            border-radius: 2px;
            padding: 1px;
          }
        `}
      </style>
      <Calendar
        tileContent={({ date }) => {
          const d = date.toISOString().slice(0, 10);
          const events = eventsByDate[d];
          if (!events || events.length === 0) return null;

          const maxVisible = 3; // 최대 3개까지만 표시
          const visibleEvents = events.slice(0, maxVisible);
          const remainingCount = events.length - maxVisible;

          return (
            <div className="calendar-event-container">
              {visibleEvents.map((event, i) => (
                <div
                  key={i}
                  className={`calendar-event-item ${event.type === 'online' ? 'calendar-event-online' : 'calendar-event-attendance'}`}
                  title={`${event.type === 'online' ? '인강' : '현강'}: ${event.title}${event.memo ? ' - ' + event.memo : ''}${event.teacher ? ' (' + event.teacher + ')' : ''}`}
                >
                  {event.type === 'online' ? '인' : '현'}: {event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="calendar-more-indicator">
                  +{remainingCount}개 더
                </div>
              )}
            </div>
          );
        }}
      />
      <div style={{
        marginTop: 16,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        fontSize: 12,
        color: "#64748b",
        lineHeight: 1.4
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>📅 캘린더 사용법</div>
        ● <span style={{ color: "#1d4ed8", fontWeight: 'bold' }}>인</span>: 온라인 진도 완료 기록<br />
        ● <span style={{ color: "#059669", fontWeight: 'bold' }}>현</span>: 현장 수업 기록<br />
        ● 날짜 위에 마우스를 올리면 전체 내용을 볼 수 있습니다<br />
        ● 항목이 많은 날은 "+N개 더"로 표시됩니다
      </div>
    </div>
  );
}

export default StudentProgressCalendar;