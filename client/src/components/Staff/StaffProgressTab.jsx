// client/src/components/Staff/StaffProgressTab.jsx
import React, { useEffect, useState } from "react";
import { fetchMonthLogs } from "../../utils/staffApi";

function MonthPicker({ value, onChange }) {
  return (
    <input type="month" value={value} onChange={(e)=>onChange(e.target.value)} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #ccc' }} />
  );
}

export default function StaffProgressTab() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const r = await fetchMonthLogs(month);
        setData(r);
      } catch {
        setErr("조회 실패");
      }
    })();
  }, [month]);

  if (err) return <div style={{ color:'#e14' }}>{err}</div>;
  if (!data) return <div style={{ color:'#888' }}>로딩중…</div>;

  const students = Object.entries(data.data || {});

  return (
    <div style={{ border:'1px solid #e5e5e5', borderRadius:12, background:'#fff' }}>
      <div style={{ padding:14, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ margin:0, fontSize:18 }}>진도 요약</h3>
        <MonthPicker value={month} onChange={setMonth} />
      </div>
      <div style={{ padding:14 }}>
        {students.length === 0 ? (
          <div style={{ color:'#888' }}>데이터가 없습니다.</div>
        ) : (
          <ul style={{ margin:0, padding:0, listStyle:'none', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {students.map(([sid, s]) => {
              const days = Object.keys(s.days || {});
              const logsCount = days.filter(d => s.days[d].log).length;
              const attendCount = days.filter(d => s.days[d].attendance && (s.days[d].attendance.inTime || s.days[d].attendance.outTime)).length;
              return (
                <li key={sid} style={{ border:'1px solid #eee', borderRadius:10, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:4 }}>{s.name}</div>
                  <div style={{ color:'#666', fontSize:14 }}>리포트 {logsCount}건 / 출결 {attendCount}일</div>
                </li>
              );
            })}
          </ul>
        )}
        <div style={{ marginTop:10, color:'#888', fontSize:12 }}>
          범위: {data.start} ~ {data.end}
        </div>
      </div>
    </div>
  );
}
