// client/src/pages/ReportPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";

function fmtNewline(s) {
  return String(s || "").split(/\r?\n/).map((line, i) => (
    <span key={i}>
      {line}
      <br/>
    </span>
  ));
}

// 분 → "X시간 Y분" 포맷
function fmtHM(min) {
  if (min === null || min === undefined || min === "") return "-";
  const n = Number(min);
  if (!Number.isFinite(n) || n < 0) return "-";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

export default function ReportPublic() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/reports/public/${code}`);
        if (mounted) setData(data);
      } catch {
        setErr("리포트를 불러올 수 없습니다.");
      }
    })();
    return () => { mounted = false; };
  }, [code]);

  if (err) return <div style={{ maxWidth: 920, margin: "32px auto", padding: 16 }}>{err}</div>;
  if (!data) return <div style={{ maxWidth: 920, margin: "32px auto", padding: 16 }}>불러오는 중…</div>;

  const { student, log, attendance, profile, counsels } = data;
  const dateLabel = log?.dateLabel || log?.date || "";

  return (
    <div style={{ fontFamily: "Pretendard, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, sans-serif", background:"#f5f7fb", minHeight:"100vh" }}>
      <div style={{ maxWidth: 920, margin: "24px auto", padding: 20 }}>
        {/* 헤더 */}
        <div style={{ background:"#fff", borderRadius:18, boxShadow:"0 6px 20px #0001", overflow:"hidden", marginBottom:18 }}>
          <div style={{ padding:"22px 26px", background:"linear-gradient(180deg,#f7fbff,#eef4ff)" }}>
            <div style={{ color:"#5a6", fontSize:14, fontWeight:700 }}>IG수학학원 데일리 리포트</div>
            <div style={{ fontSize:26, fontWeight:800, margin:"6px 0 2px" }}>{student?.name || "학생"} 학생</div>
            <div style={{ color:"#6a7" }}>{(log?.course || "-")} · {dateLabel}</div>
          </div>

          {/* 본문 그리드 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, padding:"18px 26px" }}>
            <div>
              <Section title="과정" body={fmtNewline(log?.course)} />
              <Section title="교재" body={fmtNewline(log?.book)} />
              <Section title="수업내용" body={fmtNewline(log?.content)} />
              <Section title="과제" body={fmtNewline(log?.homework)} />
              <Section title="개별 피드백" body={fmtNewline(log?.feedback)} />
            </div>

            <div>
              <Section
                title="출결"
                body={<>등원 {attendance?.checkIn || log?.inTime || "-"} / 하원 {attendance?.checkOut || log?.outTime || "-"}</>}
              />
              <Section title="형태·강사" body={<>{log?.classType || "-"} / {log?.teacher || "-"}</>} />
              {!!log?.headline && <Section title="핵심 한줄" body={fmtNewline(log.headline)} />}
              <Section
                title="태그"
                body={
                  (log?.tags || []).length
                    ? <div>{log.tags.map((t,i)=><span key={i} style={tag}>{t}</span>)}</div>
                    : <>-</>
                }
              />
              <Section
                title="학습지표"
                body={<>집중도: {log?.focus ?? "-"} · 학습시간: {fmtHM(log?.durationMin)} · 진행률: {log?.progressPct ?? "-"}%</>}
              />
            </div>
          </div>
        </div>

        {/* (선택) 프로필·로드맵 */}
        {profile?.publicOn && (
          <div style={card}>
            <div style={hd}><div style={tit}>프로필 & 로드맵</div></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, padding:"18px 26px" }}>
              <div>
                <Section title="학교/학년" body={<>{profile.school || "-"} {profile.grade || ""}</>} />
                <Section title="희망 진학" body={<>{profile.targetHigh || profile.targetUniv || "-"}</>} />
              </div>
              <div>
                <div style={{ marginBottom:10, fontWeight:700, color:"#223" }}>목표(3/6/12개월)</div>
                <div style={box}>
                  <div><b>3개월</b> — {profile.roadmap3m || "-"}</div>
                  <div style={{ marginTop:6 }}><b>6개월</b> — {profile.roadmap6m || "-"}</div>
                  <div style={{ marginTop:6 }}><b>12개월</b> — {profile.roadmap12m || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* (선택) 최근 상담 3건 */}
        {!!(counsels||[]).length && (
          <div style={card}>
            <div style={hd}><div style={tit}>최근 상담 메모</div></div>
            <div style={{ padding:"18px 26px" }}>
              <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                {counsels.map((c, i)=>(
                  <li key={i} style={{ padding:"8px 0", borderBottom:"1px solid #f0f2f8" }}>
                    <b>{c.date}</b> — {c.memo}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ background:"#fff", borderRadius:18, boxShadow:"0 6px 20px #0001", padding:"14px 26px", textAlign:"center", color:"#6a7" }}>
          이 링크는 리포트 열람용 공개 페이지입니다.
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ margin:"4px 0 10px", fontSize:16, color:"#223", fontWeight:700 }}>{title}</div>
      <div style={box}>{body || "-"}</div>
    </div>
  );
}

const card = { background:"#fff", borderRadius:18, boxShadow:"0 6px 20px #0001", overflow:"hidden", marginBottom:18 };
const hd = { padding:"22px 26px", background:"linear-gradient(180deg,#f7fbff,#eef4ff)" };
const tit = { fontSize:20, fontWeight:800 };
const box = { background:"#f9fbff", border:"1px solid #e5ecff", borderRadius:12, padding:14 };
const tag = { display:"inline-block", background:"#eef2ff", border:"1px solid #dde5ff", color:"#345", padding:"2px 8px", borderRadius:999, marginRight:6, marginBottom:6, fontSize:12 };
