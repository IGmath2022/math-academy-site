// client/src/pages/ReportPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";

export default function ReportPublic() {
  const { code } = useParams(); // /r/:code
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API_URL}/api/reports/public/${code}`);
        if (!res.data?.ok) throw new Error(res.data?.message || "조회 실패");
        setData(res.data);
      } catch (e) {
        setErr(e.message || "조회 실패");
      }
    }
    load();
  }, [code]);

  if (err) {
    return <div style={{maxWidth:920, margin:"40px auto", background:"#fff", borderRadius:16, padding:24, boxShadow:"0 8px 24px #0001"}}>
      <b style={{color:"#d22"}}>에러</b><div style={{marginTop:8}}>{err}</div>
    </div>;
  }
  if (!data) return <div style={{textAlign:"center", marginTop:60, color:"#888"}}>불러오는 중…</div>;

  const r = data.report || {};
  const name = r.student?.name || r.studentName || "학생";
  const fmt = (s) => (String(s || "").trim() ? String(s) : "-");

  return (
    <div style={{background:"#f5f7fb", minHeight:"100vh", padding:"22px 14px"}}>
      <div style={{maxWidth:920, margin:"0 auto", background:"#fff", borderRadius:18, boxShadow:"0 6px 20px #0001", overflow:"hidden"}}>
        <div style={{padding:"22px 26px", background:"linear-gradient(180deg,#f7fbff,#eef4ff)"}}>
          <div style={{color:"#27a35a", fontWeight:900}}>IG수학학원 데일리 리포트</div>
          <div style={{fontSize:26, fontWeight:800, margin:"6px 0 2px"}}>{name} 학생</div>
          <div style={{color:"#567", fontSize:14, fontWeight:700}}>
            {fmt(r.course)} · {fmt(r.dateLabel)}
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, padding:"18px 26px"}}>
          <div>
            <Section title="과정"    value={fmt(r.course)} />
            <Section title="교재"    value={fmt(r.book)} />
            <Section title="수업내용" value={fmt(r.content)} multiline />
            <Section title="과제"    value={fmt(r.homework)} multiline />
            <Section title="개별 피드백" value={fmt(r.feedback)} multiline />
          </div>
          <div>
            <Section title="출결" value={`등원 ${fmt(r.checkIn)} / 하원 ${fmt(r.checkOut)}`} />
            <Section title="형태·강사" value={`${fmt(r.classType)} / ${fmt(r.teacherName)}`} />
            <Section title="학습시간(분)" value={r.studyTimeMin ?? "-"} />
            <Section title="다음 수업 계획" value={fmt(r.planNext)} multiline />
            <div style={{marginBottom:12}}>
              <h4 style={h4}>태그</h4>
              <div style={box}>
                {Array.isArray(r.tags) && r.tags.length
                  ? r.tags.map((t,i)=><span key={i} style={tag}>{t}</span>)
                  : "-"}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:"14px 26px", textAlign:"center", color:"#6a7"}}>
          이 링크는 리포트 열람용 공개 페이지입니다.
        </div>
      </div>
    </div>
  );
}

function Section({ title, value, multiline=false }) {
  return (
    <div style={{marginBottom:12}}>
      <h4 style={h4}>{title}</h4>
      <div style={box}>{multiline ? String(value).split('\n').map((l,i)=><div key={i}>{l}</div>) : value}</div>
    </div>
  );
}

const h4 = { margin:"4px 0 10px", fontSize:16, color:"#223" };
const box = { background:"#f9fbff", border:"1px solid #e5ecff", borderRadius:12, padding:14 };
const tag = { display:"inline-block", background:"#eef2ff", border:"1px solid #dde5ff", color:"#345",
              padding:"2px 8px", borderRadius:999, marginRight:6, marginBottom:6, fontSize:12 };
