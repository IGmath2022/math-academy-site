// client/src/components/Staff/StaffCalendarTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchMonthLogs } from "../../utils/staffApi";

export default function StaffCalendarTab() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchMonthLogs(month);
        setData(r);
      } catch {
        setErr("캘린더 조회 실패");
      }
    })();
  }, [month]);

  const byDate = useMemo(() => {
    const map = {};
    const students = Object.entries(data?.data || {});
    students.forEach(([sid, s]) => {
      Object.entries(s.days || {}).forEach(([d, obj]) => {
        map[d] = map[d] || [];
        map[d].push({ name: s.name, ...obj });
      });
    });
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [data]);

  if (err) return <div style={{ color:'#e14' }}>{err}</div>;
  if (!data) return <div style={{ color:'#888' }}>로딩중…</div>;

  return (
    <div style={{ border:'1px solid #e5e5e5', borderRadius:12, background:'#fff' }}>
      <div style={{ padding:14, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ margin:0, fontSize:18 }}>반 캘린더</h3>
        <input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #ccc' }} />
      </div>
      <div style={{ padding:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {byDate.length === 0 ? (
          <div style={{ color:'#888', padding:10 }}>데이터가 없습니다.</div>
        ) : byDate.map(([d, arr]) => (
          <div key={d} style={{ border:'1px solid #eee', borderRadius:10, padding:10 }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>{d}</div>
            <ul style={{ margin:0, paddingLeft:18 }}>
              {arr.map((x, i) => (
                <li key={i} style={{ marginBottom:6 }}>
                  <b>{x.name}</b> — {x.log?.content ? x.log.content : '수업내용 없음'} {x.attendance ? `(${x.attendance.inTime || '-'}~${x.attendance.outTime || '-'})` : ''}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
