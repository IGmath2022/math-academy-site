// client/src/components/Staff/StaffReportsTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listLessonsByDate,
  sendSelected,
} from "../../utils/staffApi";
import LessonEditorPanel from "./LessonEditorPanel";

export default function StaffReportsTab() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(todayStr);
  const [scope, setScope] = useState("present"); // present | all | missing
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null); // {id, name}
  const [pendingSend, setPendingSend] = useState(false);
  const [checkedIds, setCheckedIds] = useState({}); // { [logId]: boolean }

  const load = async () => {
    try {
      setErr("");
      setList(null);
      const r = await listLessonsByDate({ date, scope });
      setList(r?.items || []);
    } catch {
      setErr("목록 로드 실패");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, scope]);

  const toggleCheck = (logId, on) => {
    setCheckedIds((prev) => ({ ...prev, [logId]: on }));
  };

  const bulkSend = async () => {
    try {
      setPendingSend(true);
      const ids = Object.entries(checkedIds)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (ids.length === 0) return;
      await sendSelected(ids);
      await load();
      setCheckedIds({});
    } finally {
      setPendingSend(false);
    }
  };

  return (
    <>
      <Panel>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="present">오늘 등원/작성자</option>
            <option value="all">전체 활성 학생</option>
            <option value="missing">미작성/미출결</option>
          </select>
          <button onClick={load} style={btn}>
            새로고침
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={bulkSend} disabled={pendingSend} style={btnPrimary}>
            {pendingSend ? "발송 중…" : "선택 발송"}
          </button>
        </div>

        {err && <ErrorLine>{err}</ErrorLine>}
        {!list ? (
          <Muted>불러오는 중…</Muted>
        ) : list.length === 0 ? (
          <Muted>대상이 없습니다.</Muted>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                <th style={th}>이름</th>
                <th style={th}>등원</th>
                <th style={th}>하원</th>
                <th style={th}>리포트</th>
                <th style={th}>발송상태</th>
                <th style={th}>선택</th>
                <th style={th}>편집</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.studentId} style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <td style={td}>{row.name}</td>
                  <td style={td}>{row.checkIn || "-"}</td>
                  <td style={td}>{row.checkOut || "-"}</td>
                  <td style={td}>{row.hasLog ? "작성됨" : "-"}</td>
                  <td style={td}>{row.notifyStatus}</td>
                  <td style={td}>
                    {row.logId ? (
                      <input
                        type="checkbox"
                        checked={!!checkedIds[row.logId]}
                        onChange={(e) => toggleCheck(row.logId, e.target.checked)}
                      />
                    ) : (
                      <span style={{ color: "#bbb" }}>-</span>
                    )}
                  </td>
                  <td style={td}>
                    <button
                      style={btn}
                      onClick={() => setSelected({ id: row.studentId, name: row.name })}
                    >
                      열기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {selected && (
        <LessonEditorPanel
          student={{ id: selected.id, name: selected.name }}
          date={date}
          onSaved={() => load()}
        />
      )}
    </>
  );
}

/* ---------- UI bits ---------- */
const Panel = ({ children }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e5e5e5",
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);
const Muted = ({ children }) => (
  <div style={{ color: "#888", textAlign: "center" }}>{children}</div>
);
const ErrorLine = ({ children }) => (
  <div style={{ color: "#c11", margin: "6px 0" }}>{children}</div>
);
const btn = {
  padding: "7px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};
const btnPrimary = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 10,
  background: "#226ad6",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};
const th = { padding: "8px 6px", fontSize: 13, color: "#666" };
const td = { padding: "10px 6px", fontSize: 14 };
