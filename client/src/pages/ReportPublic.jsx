// client/src/pages/ReportPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";

export default function ReportPublic() {
  const { code } = useParams();
  const [data, setData] = useState(null);   // { student, log, attendance, studyTimeMin, recent }
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const res = await axios.get(`${API_URL}/api/reports/public/${code}`);
        setData(res.data);
      } catch (e) {
        const msg = e?.response?.data?.message || "리포트를 찾을 수 없습니다.";
        setError(msg);
      }
    }
    if (code) load();
  }, [code]);

  if (error) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h2 style={{ margin: 0 }}>리포트 열람</h2>
          <p style={{ color: "#c33", marginTop: 10 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={wrap}>
        <div style={card}>불러오는 중…</div>
      </div>
    );
  }

  const { student, log, attendance, studyTimeMin, recent } = data;
  const fmt = (s = "-") => String(s || "-").split("\n").map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));

  return (
    <div style={wrap}>
      {/* 현재 회차 */}
      <div style={card}>
        <div style={header}>
          <div style={sub}>IG수학학원 데일리 리포트</div>
          <div style={tit}>{student?.name || "학생"} 학생</div>
          <div style={{ color: "#5b6" }}>
            {(log?.course || "-")} · {log?.date || ""}
          </div>
        </div>

        <div style={grid}>
          <div style={col}>
            <H4>과정</H4><Box>{fmt(log?.course)}</Box>
            <H4>교재</H4><Box>{fmt(log?.book)}</Box>
            <H4>수업내용</H4><Box>{fmt(log?.content)}</Box>
            <H4>과제</H4><Box>{fmt(log?.homework)}</Box>
            <H4>개별 피드백</H4><Box>{fmt(log?.feedback)}</Box>
          </div>
          <div style={col}>
            <H4>출결</H4>
            <Box>등원 {attendance?.in || "-"} / 하원 {attendance?.out || "-"}</Box>
            <H4>학습시간(분)</H4>
            <Box>{studyTimeMin ?? "-"}</Box>
            <H4>형태·강사</H4>
            <Box>{(log?.classType || "-")} / {(log?.teacherName || log?.teacher || "-")}</Box>
            <H4>태그</H4>
            <Box>
              {(log?.tags || []).length
                ? (log.tags || []).map((t, i) => (
                    <span key={i} style={tag}>{t}</span>
                  ))
                : "-"}
            </Box>
            <H4>다음 수업 계획</H4>
            <Box>{fmt(log?.planNext || log?.nextPlan)}</Box>
          </div>
        </div>
      </div>

      {/* 누적 표 */}
      <div style={card}>
        <div style={header}>
          <div style={tit}>누적 리포트 (최근 {(recent || []).length}회)</div>
        </div>
        <div style={{ padding: "12px 18px 18px", overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <Th style={{ width: 110 }}>날짜</Th>
                <Th style={{ width: 180 }}>과정</Th>
                <Th style={{ width: 120 }}>학습시간(분)</Th>
                <Th>핵심/태그</Th>
                <Th style={{ width: 120 }}>보기</Th>
              </tr>
            </thead>
            <tbody>
              {(recent || []).map((r) => (
                <tr key={r._id}>
                  <Td>{r.date}</Td>
                  <Td>{r.course || "-"}</Td>
                  <Td>{r.studyTimeMin ?? "-"}</Td>
                  <Td>
                    {(r.headline || "").split("\n").map((ln, i) => (
                      <span key={i}>
                        {ln}
                        <br />
                      </span>
                    ))}
                    {(r.tags || []).map((t, i) => (
                      <span key={i} style={tag}>{t}</span>
                    ))}
                  </Td>
                  <Td>
                    <a href={`/r/${r._id}`} target="_blank" rel="noreferrer">
                      열람
                    </a>
                  </Td>
                </tr>
              ))}
              {(!recent || recent.length === 0) && (
                <tr>
                  <Td colSpan={5} style={{ color: "#888" }}>누적 리포트가 없습니다.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, padding: "14px 26px", textAlign: "center", color: "#6a7" }}>
        이 링크는 리포트 열람용 공개 페이지입니다.
      </div>
    </div>
  );
}

/* 작은 프리셋 스타일 */
const wrap = { maxWidth: 940, margin: "24px auto", padding: 20, background: "#f5f7fb" };
const card = { background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px #0001", overflow: "hidden", marginBottom: 18 };
const header = { padding: "22px 26px", background: "linear-gradient(180deg,#f7fbff,#eef4ff)" };
const sub = { color: "#5a6", fontSize: 14, fontWeight: 700 };
const tit = { fontSize: 26, fontWeight: 800, margin: "6px 0 2px" };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "18px 26px" };
const col = { padding: 0 };
const H4 = ({ children }) => <h4 style={{ margin: "4px 0 10px", fontSize: 16, color: "#223" }}>{children}</h4>;
const Box = ({ children }) => <div style={{ background: "#f9fbff", border: "1px solid #e5ecff", borderRadius: 12, padding: 14, minHeight: 44 }}>{children}</div>;
const table = { width: "100%", borderCollapse: "collapse" };
const Th = ({ children, style }) => <th style={{ background: "#f7f9ff", borderBottom: "1px solid #eef2ff", padding: "10px 8px", textAlign: "left", fontSize: 14, ...style }}>{children}</th>;
const Td = ({ children, colSpan, style }) => <td colSpan={colSpan} style={{ borderBottom: "1px solid #eef2ff", padding: "10px 8px", textAlign: "left", fontSize: 14, ...style }}>{children}</td>;
const tag = { display: "inline-block", background: "#eef2ff", border: "1px solid #dde5ff", color: "#345", padding: "2px 8px", borderRadius: 999, marginRight: 6, marginBottom: 4, fontSize: 12 };
