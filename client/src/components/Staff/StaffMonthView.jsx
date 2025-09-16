// client/src/components/Staff/StaffMonthView.jsx
import React, { useEffect, useState } from "react";
import { fetchMonthLogs } from "../../utils/staffApi";

function MonthPicker({ value, onChange }) {
  const [v, setV] = useState(value || new Date().toISOString().slice(0,7));
  useEffect(() => setV(value), [value]);
  return (
    <input
      type="month"
      value={v}
      onChange={(e) => { setV(e.target.value); onChange && onChange(e.target.value); }}
      style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #ccc' }}
    />
  );
}

export default function StaffMonthView() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchMonthLogs(month);
        setData(r);
      } catch {
        setErr("월간 데이터 조회 실패");
      }
    })();
  }, [month]);

  if (err) return <div style={{ color:'#e14' }}>{err}</div>;
  if (!data) return <div style={{ color:'#888' }}>월간 데이터 로딩중…</div>;

  const students = Object.entries(data.data || {});

  return (
    <div style={{ border:'1px solid #e5e5e5', borderRadius:12, padding:16, background:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h3 style={{ margin:0, fontSize:18 }}>월간 진도/출결 요약</h3>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {students.length === 0 ? (
        <div style={{ color:'#888' }}>표시할 학생이 없습니다.</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={th}>학생</th>
                <th style={th}>날짜</th>
                <th style={th}>출결</th>
                <th style={th}>수업내용</th>
                <th style={th}>과제</th>
                <th style={th}>다음수업계획</th>
                <th style={th}>강사</th>
                <th style={th}>학습시간(분)</th>
                <th style={th}>발송</th>
              </tr>
            </thead>
            <tbody>
              {students.map(([sid, s]) => {
                const days = Object.entries(s.days || {}).sort((a,b)=>a[0].localeCompare(b[0]));
                if (days.length === 0) {
                  return (
                    <tr key={sid}>
                      <td style={td}>{s.name}</td>
                      <td style={td} colSpan={8}>&mdash;</td>
                    </tr>
                  );
                }
                return days.map(([d, obj], idx) => (
                  <tr key={`${sid}-${d}`}>
                    {idx===0 ? <td style={td} rowSpan={days.length}><b>{s.name}</b></td> : null}
                    <td style={td}>{d}</td>
                    <td style={td}>{obj.attendance?.inTime || '-'} ~ {obj.attendance?.outTime || '-'}</td>
                    <td style={td}>{obj.log?.content || ''}</td>
                    <td style={td}>{obj.log?.homework || ''}</td>
                    <td style={td}>{obj.log?.planNext || ''}</td>
                    <td style={td}>{obj.log?.teacher || ''}</td>
                    <td style={td}>{obj.log?.durationMin ?? ''}</td>
                    <td style={td}>{obj.log?.notifyStatus || ''}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop:8, color:'#888', fontSize:12 }}>
        범위: {data.start} ~ {data.end}
      </div>
    </div>
  );
}
const th = { padding:'8px', borderBottom:'1px solid #eee', textAlign:'left', background:'#f9fafb' };
const td = { padding:'8px', borderBottom:'1px solid #f2f2f2', verticalAlign:'top' };
