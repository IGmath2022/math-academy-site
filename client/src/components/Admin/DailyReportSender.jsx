// client/src/components/Admin/DailyReportSender.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";

function StatusPill({ v }) {
  const map = {
    "발송": { bg: "#e6f7ee", color: "#0a8f4a" },
    "대기": { bg: "#fff7e6", color: "#aa6b00" },
    "실패": { bg: "#fdeaea", color: "#c21d1d" },
    "없음": { bg: "#eef1f7", color: "#556" }
  };
  const s = map[v] || map["없음"];
  return (
    <span style={{ padding: "4px 8px", borderRadius: 999, background: s.bg, color: s.color, fontSize: 13, fontWeight: 700 }}>
      {v}
    </span>
  );
}

export default function DailyReportSender() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const fetchList = async () => {
    setLoading(true);
    try {
      // 관리자용 날짜별 목록 (등원자 ∪ 해당일 LessonLog 보유자)
      const { data } = await axios.get(`${API_URL}/api/admin/lessons/by-date`, { ...auth, params: { date } });
      setItems(data.items || []);
      setSel({});
    } catch (e) {
      setMsg("목록 조회 실패");
      setTimeout(() => setMsg(""), 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchList(); /* eslint-disable-next-line */ }, [date]);

  const toggle = (logId, v) => setSel(prev => ({ ...prev, [logId]: v }));

  const sendOne = async (logId) => {
    try {
      await axios.post(`${API_URL}/api/admin/lessons/${logId}/send`, {}, auth);
      await fetchList();
      setMsg("발송 완료");
      setTimeout(() => setMsg(""), 1200);
    } catch (e) {
      setMsg(e?.response?.data?.message || "발송 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  const sendSelected = async () => {
    const ids = Object.keys(sel).filter(k => sel[k]);
    if (ids.length === 0) {
      setMsg("선택된 항목이 없습니다.");
      setTimeout(() => setMsg(""), 1000);
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/lessons/send-selected`, { ids }, auth);
      await fetchList();
      setMsg("선택 발송 완료");
      setTimeout(() => setMsg(""), 1200);
    } catch {
      setMsg("선택 발송 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  // IN 보정 (로그는 있는데 등원 누락된 학생)
  const fixIn = async (studentId) => {
    try {
      await axios.post(`${API_URL}/api/attendance/admin/fix-in`, {
        studentId,
        date
      }, auth);
      await fetchList();
      setMsg("보정 IN 생성됨");
      setTimeout(() => setMsg(""), 1200);
    } catch (e) {
      setMsg(e?.response?.data?.message || "보정 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  return (
    <div style={{ margin: "12px 0 20px", padding: 16, background: "#fff", border: "1px solid #e6e9f2", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <b style={{ fontSize: 16 }}>데일리 리포트 발송(수동)</b>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #ccd3e0" }}
        />
        <button
          onClick={fetchList}
          disabled={loading}
          style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#eef3ff", color: "#246", fontWeight: 700 }}
        >
          새로고침
        </button>
        <div style={{ marginLeft: "auto", color: "#678", fontSize: 13 }}>
          상태: 없음=로그 미작성, 대기=예약, 발송=완료
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f7fc" }}>
              <th style={th}>선택</th>
              <th style={th}>이름</th>
              <th style={th}>등원</th>
              <th style={th}>하원</th>
              <th style={th}>상태</th>
              <th style={th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const disabled = !it.hasLog || it.notifyStatus === "발송";
              return (
                <tr key={it.studentId} style={{ borderTop: "1px solid #eef1f7" }}>
                  <td style={tdCenter}>
                    <input
                      type="checkbox"
                      disabled={!it.logId || it.notifyStatus === "발송"}
                      checked={!!sel[it.logId]}
                      onChange={e => toggle(it.logId, e.target.checked)}
                    />
                  </td>
                  <td style={td}>{it.name}</td>
                  <td style={tdCenter}>{it.checkIn || "-"}</td>
                  <td style={tdCenter}>{it.checkOut || "-"}</td>
                  <td style={tdCenter}><StatusPill v={it.hasLog ? it.notifyStatus : "없음"} /></td>
                  <td style={tdCenter}>
                    <button
                      disabled={!it.logId || disabled}
                      onClick={() => sendOne(it.logId)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: disabled ? "#eee" : "#226ad6",
                        color: disabled ? "#999" : "#fff",
                        fontWeight: 700
                      }}
                    >
                      발송
                    </button>

                    {/* 리포트는 있는데 IN이 없을 때 보정 버튼 노출 */}
                    {it.hasLog && !it.checkIn && (
                      <button
                        onClick={() => fixIn(it.studentId)}
                        style={{
                          marginLeft: 6,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid #f0b2b2",
                          background: "#fff5f5",
                          color: "#b21d1d",
                          fontWeight: 700
                        }}
                        title="로그는 있지만 등원이 없어 보정 IN을 생성합니다."
                      >
                        보정IN
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#789" }}>해당 날짜 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button
          onClick={sendSelected}
          style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#1e7b34", color: "#fff", fontWeight: 800 }}
        >
          선택 발송
        </button>
      </div>

      {msg && <div style={{ marginTop: 8, color: "#226ad6", fontWeight: 700 }}>{msg}</div>}
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 8px", fontSize: 14, color: "#456" };
const td = { padding: "10px 8px", fontSize: 14, color: "#333" };
const tdCenter = { ...td, textAlign: "center" };
