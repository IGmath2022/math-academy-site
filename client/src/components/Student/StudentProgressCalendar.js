import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// props: progressList [{date: "YYYY-MM-DD", memo: "...", chapterId: ...}, ...]
//        chaptersMap { chapterId: { name, ... }, ... }
//        attendanceList [{date: "YYYY-MM-DD", course: "...", content: "...", teacher: "..."}, ...]
function StudentProgressCalendar({ progressList, chaptersMap, attendanceList = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // 달력에 표시할 날짜 만들기 - 온라인 진도와 현강 데이터 통합
  const eventsByDate = {};

  // 날짜 정규화 함수 (시간대 문제 해결)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // UTC 기준으로 YYYY-MM-DD 문자열 생성 (시간대 오류 방지)
    return date.getUTCFullYear() + '-' +
           String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
           String(date.getUTCDate()).padStart(2, '0');
  };

  // 온라인 진도 데이터 추가
  progressList.forEach(p => {
    const normalizedDate = normalizeDate(p.date);
    if (normalizedDate) {
      eventsByDate[normalizedDate] = eventsByDate[normalizedDate] || [];
      eventsByDate[normalizedDate].push({
        type: 'online',
        title: chaptersMap[p.chapterId]?.name || p.chapterId,
        memo: p.memo,
        color: "#1d4ed8", // 파란색 (인강)
        originalData: p
      });
    }
  });

  // 현강 데이터 추가
  attendanceList.forEach(a => {
    const normalizedDate = normalizeDate(a.date);
    if (normalizedDate) {
      eventsByDate[normalizedDate] = eventsByDate[normalizedDate] || [];
      eventsByDate[normalizedDate].push({
        type: 'attendance',
        title: a.course || '수업',
        memo: a.content,
        teacher: a.teacher,
        color: "#059669", // 초록색 (현강)
        originalData: a
      });
    }
  });

  // 날짜 클릭 핸들러
  const handleDateClick = (date) => {
    const dateStr = normalizeDate(date.toISOString());
    const events = eventsByDate[dateStr] || [];
    if (events.length > 0) {
      setSelectedDate(dateStr);
      setSelectedEvents(events);
    }
  };

  // 상세 정보 모달 닫기
  const closeDetailModal = () => {
    setSelectedDate(null);
    setSelectedEvents([]);
  };

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
        onClickDay={handleDateClick}
        tileContent={({ date }) => {
          const d = normalizeDate(date.toISOString());
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
        ● 항목이 많은 날은 "+N개 더"로 표시됩니다<br />
        ● 날짜를 클릭하면 상세 정보를 볼 수 있습니다
      </div>

      {/* 상세 정보 모달 */}
      {selectedDate && selectedEvents.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1f2937'
              }}>
                📅 {selectedDate} 일정
              </h3>
              <button
                onClick={closeDetailModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {selectedEvents.map((event, index) => (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: event.type === 'online' ? '#eff6ff' : '#f0fdf4',
                    border: `1px solid ${event.type === 'online' ? '#bfdbfe' : '#bbf7d0'}`,
                    borderRadius: 8,
                    borderLeft: `4px solid ${event.color}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8
                  }}>
                    <span style={{
                      background: event.color,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {event.type === 'online' ? '인강' : '현강'}
                    </span>
                    <h4 style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      {event.title}
                    </h4>
                  </div>

                  {event.memo && (
                    <div style={{
                      marginBottom: 8,
                      fontSize: 14,
                      color: '#4b5563',
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: 8,
                      borderRadius: 4
                    }}>
                      <strong>내용:</strong> {event.memo}
                    </div>
                  )}

                  {event.teacher && (
                    <div style={{
                      fontSize: 14,
                      color: '#059669',
                      fontWeight: '500'
                    }}>
                      👨‍🏫 선생님: {event.teacher}
                    </div>
                  )}

                  {event.type === 'attendance' && event.originalData && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                      {event.originalData.homework && (
                        <div style={{ marginBottom: 4 }}>
                          <strong>숙제:</strong> {event.originalData.homework}
                        </div>
                      )}
                      {event.originalData.planNext && (
                        <div>
                          <strong>다음 계획:</strong> {event.originalData.planNext}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <button
                onClick={closeDetailModal}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentProgressCalendar;