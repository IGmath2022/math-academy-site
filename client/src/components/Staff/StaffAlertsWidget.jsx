// client/src/components/Staff/StaffAlertsWidget.jsx
import React, { useEffect, useState } from "react";
import { fetchTodayAlerts, getDailyAuto, setDailyAuto } from "../../utils/staffApi";

export default function StaffAlertsWidget() {
  const [data, setData] = useState(null);
  const [auto, setAuto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([fetchTodayAlerts(), getDailyAuto()]);
        setData(a);
        setAuto(!!s.on);
      } catch (e) {
        setErr("알림/설정 조회 실패");
      }
    })();
  }, []);

  const toggleAuto = async () => {
    try {
      setSaving(true);
      const r = await setDailyAuto(!auto);
      setAuto(!!r.on);
    } catch {
      setErr("자동발송 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (err) return <div style={{ color:'#e14' }}>{err}</div>;
  if (!data) return <div style={{ color:'#888' }}>위젯 로딩중…</div>;

  return (
    <div style={{ border:'1px solid #e5e5e5', borderRadius:12, padding:16, background:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h3 style={{ margin:0, fontSize:18 }}>오늘의 알림</h3>
        <button
          disabled={saving}
          onClick={toggleAuto}
          style={{ padding:'6px 12px', border:'none', borderRadius:8, background: auto ? '#227a22' : '#999', color:'#fff', fontWeight:700, cursor:'pointer' }}
        >
          일일리포트 자동발송: {auto ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:'#f9fbff', borderRadius:10, padding:12 }}>
          <b>오늘 미출결</b>
          <div style={{ fontSize:28, fontWeight:800, margin:'6px 0 10px' }}>{data.counts?.missingAttendance ?? 0}</div>
          <div style={{ maxHeight:120, overflowY:'auto', fontSize:14 }}>
            {(data.missingAttendance || []).map(s => (
              <div key={s.id}>• {s.name}</div>
            ))}
          </div>
        </div>
        <div style={{ background:'#fff8f8', borderRadius:10, padding:12 }}>
          <b>어제 미작성 리포트</b>
          <div style={{ fontSize:28, fontWeight:800, margin:'6px 0 10px' }}>{data.counts?.missingReport ?? 0}</div>
          <div style={{ maxHeight:120, overflowY:'auto', fontSize:14 }}>
            {(data.missingReport || []).map(s => (
              <div key={s.id}>• {s.name}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop:8, color:'#888', fontSize:12 }}>
        기준일: {data.date}
      </div>
    </div>
  );
}
