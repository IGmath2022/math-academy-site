// client/src/components/Admin/DailyReportSender.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

// JWT에서 payload 추출
function parseJwt(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; }
}

export default function DailyReportSender() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // 공통 네트워크 래퍼 (콘솔 로깅)
  async function call(method, url, data) {
    try {
      console.log("[REPORT] REQ:", method, url, data || {});
      const res = await axios({ method, url, data, ...auth });
      console.log("[REPORT] RES:", res.status, res.data);
      return res.data;
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "요청 실패";
      console.error("[REPORT] ERR:", msg, e?.response?.data || {});
      throw new Error(msg);
    }
  }

  // 날짜별 목록 로드
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await call(
        "get",
        `${API_URL}/api/admin/lessons/by-date?date=${date}`
      );
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [date]);

  // 업서트 저장
  async function handleSaveLog(row) {
    const payload = {
      studentId: row.studentId,
      date,
      course: row.course || "",
      book: row.book || "",
      content: row.content || "",
      homework: row.homework || "",
      feedback: row.feedback || "",
      scheduledAt: row.scheduledAt || null,
      notifyStatus: row.notifyStatus || "대기"
    };
    await call("post", `${API_URL}/api/admin/lessons/upsert`, payload);
    await refresh();
  }

  // 단건 발송
  async function handleSendOne(id) {
    setSendingId(id);
    try {
      await call("post", `${API_URL}/api/admin/lessons/send-one/${id}`, {});
      await refresh();
    } catch (e) {
      alert("발송 실패: " + e.message);
    } finally {
      setSendingId("");
    }
  }

  // 선택 발송
  async function handleSendSelected() {
    const ids = items
      .filter(x => x.hasLog && x.notifyStatus !== "발송")
      .map(x => x.logId)
      .filter(Boolean);
    if (ids.length === 0) {
      alert("발송 대상이 없습니다.");
      return;
    }
    await call("post", `${API_URL}/api/admin/lessons/send-selected`, { ids });
    await refresh();
  }

  return (
    <div style={{
      border: "1px solid #e5e5e5",
      background: "#fff",
      borderRadius: 12,
      padding: 16,
      marginTop: 18
    }}>
      <h3 style={{ margin: "0 0 12px 0" }}>일일 리포트 발송</h3>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button
          onClick={refresh}
          style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#eee" }}
        >
          새로고침
        </button>
        <button
          onClick={handleSendSelected}
          style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#226ad6", color: "#fff", fontWeight: 700 }}
        >
          선택 발송(미발송 전체)
        </button>
      </div>

      {loading && <div style={{ color: "#888" }}>불러오는 중...</div>}
      {error && <div style={{ color: "#d22" }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7f8fb" }}>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>학생</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>등원</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>하원</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>작성여부</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>발송상태</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => (
              <tr key={row.studentId}>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{row.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{row.checkIn || '-'}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{row.checkOut || '-'}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                  {row.hasLog ? 'Y' : 'N'}
                  {row.missingIn && <span style={{ marginLeft: 8, color: "#d22" }}>(등원기록 없음)</span>}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{row.notifyStatus}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                  {row.hasLog ? (
                    <button
                      onClick={() => handleSendOne(row.logId)}
                      disabled={sendingId === row.logId || row.notifyStatus === '발송'}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: row.notifyStatus === '발송' ? "#aaa" : "#3cbb2c",
                        color: "#fff",
                        fontWeight: 700
                      }}
                    >
                      {sendingId === row.logId ? "전송중..." : (row.notifyStatus === '발송' ? "발송완료" : "보내기")}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        // 최초 작성(업서트) 다이얼로그 대신 간단 입력
                        const course = prompt("과정", "");
                        const book = prompt("교재", "");
                        const content = prompt("수업내용(요약)", "");
                        const homework = prompt("과제(줄바꿈으로 여러개)", "");
                        const feedback = prompt("개별 피드백(요약)", "");
                        await handleSaveLog({
                          ...row,
                          course, book, content, homework, feedback,
                          notifyStatus: "대기"
                        });
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        background: "#fff"
                      }}
                    >
                      작성
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td colSpan={6} style={{ padding: 12, color: "#888" }}>데이터 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
