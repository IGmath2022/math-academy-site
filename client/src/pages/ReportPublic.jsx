// client/src/pages/ReportPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../api";

export default function ReportPublic() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`${API_URL}/api/reports/public/${code}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || `HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        setErr(e.message || "로드 실패");
      }
    }
    run();
  }, [code]);

  if (err) {
    return (
      <div style={{maxWidth:680, margin:"60px auto", padding:"0 16px", color:"#b00", textAlign:"center"}}>
        리포트를 불러오지 못했습니다.<br/>{err}
      </div>
    );
  }
  if (!data) {
    return <div style={{maxWidth:680, margin:"60px auto", padding:"0 16px", color:"#666", textAlign:"center"}}>불러오는 중…</div>;
  }

  return (
    <div style={{maxWidth:720, margin:"32px auto", padding:"20px 16px"}}>
      <div style={{borderRadius:14, boxShadow:"0 6px 22px #0001", overflow:"hidden", background:"#fff"}}>
        <div style={{padding:"18px 20px", background:"linear-gradient(135deg,#eef2ff,#f8faff)"}}>
          <div style={{fontSize:18, color:"#6b7", fontWeight:700}}>IG수학학원 데일리 리포트</div>
          <div style={{fontSize:26, fontWeight:900, color:"#1b2c58", marginTop:6}}>
            {data.studentName} <span style={{fontWeight:700, color:"#314"}}>학생</span>
          </div>
          <div style={{marginTop:2, color:"#4a4f6a", fontWeight:700}}>
            {data.course} · {data.date}
          </div>
        </div>

        <div style={{padding:"18px 20px"}}>
          <Item label="과정" value={data.course}/>
          <Item label="교재" value={data.book}/>
          <Item label="수업내용" value={data.content}/>
          <Item label="과제" value={data.homework}/>
          <Item label="개별 피드백" value={data.feedback}/>
          {(data.checkIn || data.checkOut) && (
            <Item label="출결" value={`등원 ${data.checkIn || '-'} / 하원 ${data.checkOut || '-'}`}/>
          )}
          {(data.classType || data.teacher) && (
            <Item label="형태/강사" value={`${data.classType || '-'} / ${data.teacher || '-'}`}/>
          )}
          {Array.isArray(data.tags) && data.tags.length > 0 && (
            <Item label="태그" value={data.tags.join(', ')} />
          )}
        </div>
      </div>

      <div style={{textAlign:"center", marginTop:18, color:"#6a6"}}>
        이 링크는 리포트 열람용 공개 페이지입니다.
      </div>
    </div>
  );
}

function Item({label, value}) {
  return (
    <div style={{margin:"10px 0"}}>
      <div style={{fontSize:13, color:"#6c78a4", fontWeight:700, marginBottom:4}}>{label}</div>
      <div style={{whiteSpace:"pre-wrap", lineHeight:1.65, fontSize:16, color:"#222"}}>{value || "-"}</div>
    </div>
  );
}
