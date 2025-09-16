// client/src/components/Staff/StaffWorkloadCards.jsx
import React, { useEffect, useState } from "react";
import { fetchWorkload } from "../../utils/staffApi";

export default function StaffWorkloadCards() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchWorkload();
        setData(r);
      } catch {
        setErr("워크로드 조회 실패");
      }
    })();
  }, []);

  if (err) return <div style={{ color:'#e14' }}>{err}</div>;
  if (!data) return <div style={{ color:'#888' }}>로드 중…</div>;

  const Card = ({ title, value, sub }) => (
    <div style={{
      padding:16,
      background:'#fff',
      border:'1px solid #e5e5e5',
      borderRadius:12,
      boxShadow:'0 2px 10px rgba(0,0,0,.03)'
    }}>
      <div style={{ fontSize:13, color:'#666' }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:800, lineHeight:'36px' }}>{value}</div>
      {sub && <div style={{ color:'#888', fontSize:12 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <Card
        title="담당 반 수"
        value={data.groups}
        sub={data.role === 'teacher' ? '내가 담당 중' : '전체 활성'}
      />
      <Card
        title="담당 학생 수"
        value={data.students}
        sub={data.role === 'teacher' ? '내 반 소속 학생' : '중복 제거 후'}
      />
    </div>
  );
}
