// client/src/components/Staff/StaffCounselTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchCounselByMonth,
  upsertCounsel,
  deleteCounsel,
} from "../../utils/staffApi";

export default function StaffCounselTab() {
  const thisMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [month, setMonth] = useState(thisMonth);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 입력 폼(간단)
  const [form, setForm] = useState({
    studentId: "",
    date: new Date().toISOString().slice(0, 10),
    memo: "",
    publicOn: false,
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const rows = await fetchCounselByMonth(month);
      setList(Array.isArray(rows) ? rows : []); // 🔒 방어
    } catch (e) {
      setErr("상담 목록을 불러오지 못했습니다.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <div>
      <Panel>
        <h3 style={{ marginTop: 0 }}>상담 목록</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value.slice(0, 7))}
          />
          <button style={btn} onClick={load}>새로고침</button>
        </div>

        {err && <ErrorLine>{err}</ErrorLine>}
        {loading ? (
          <Muted>불러오는 중…</Muted>
        ) : (Array.isArray(list) && list.length > 0) ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                <th style={th}>날짜</th>
                <th style={th}>학생</th>
                <th style={th}>메모</th>
                <th style={th}>공개</th>
                <th style={th}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                  <td style={td}>{r.date}</td>
                  <td style={td}>{r.studentName || r.studentId}</td>
                  <td style={td}>
                    <span title={r.memo}>{truncate(r.memo, 80)}</span>
                  </td>
                  <td style={td}>{r.publicOn ? "공개" : "-"}</td>
                  <td style={td}>
                    <button
                      style={btnDanger}
                      onClick={async () => {
                        if (!window.confirm("삭제할까요?")) return;
                        try {
                          await deleteCounsel(r._id);
                          await load();
                        } catch {
                          alert("삭제 실패");
                        }
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Muted>데이터가 없습니다.</Muted>
        )}
      </Panel>

      <Panel>
        <h3 style={{ marginTop: 0 }}>상담 등록/수정 (업서트)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <div style={lbl}>학생 ID</div>
            <input
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              style={inp}
              placeholder="학생 ObjectId"
            />
          </div>
          <div>
            <div style={lbl}>날짜</div>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inp}
            />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
            <label style={{ fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.publicOn}
                onChange={(e) => setForm({ ...form, publicOn: e.target.checked })}
                style={{ marginRight: 6 }}
              />
              공개뷰 포함
            </label>
            <div style={{ flex: 1 }} />
            <button
              style={btnPrimary}
              disabled={saving}
              onClick={async () => {
                if (!form.studentId || !form.date) {
                  alert("studentId / date는 필수입니다.");
                  return;
                }
                try {
                  setSaving(true);
                  await upsertCounsel(form);
                  setForm((f) => ({ ...f, memo: "" }));
                  await load();
                } catch {
                  alert("저장 실패");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
          <div style={{ gridColumn: "1 / 4" }}>
            <div style={lbl}>메모</div>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={4}
              style={{ ...inp, resize: "vertical" }}
              placeholder="상담 내용을 입력하세요(최대 3000자)"
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- helpers & styles ---------- */
function truncate(s, limit) {
  const t = String(s || "");
  return t.length > limit ? t.slice(0, limit - 1) + "…" : t;
}

const Panel = ({ children }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 14, marginBottom: 12 }}>
    {children}
  </div>
);
const Muted = ({ children }) => <div style={{ color: "#888", textAlign: "center" }}>{children}</div>;
const ErrorLine = ({ children }) => <div style={{ color: "#c11", margin: "6px 0" }}>{children}</div>;

const th = { padding: "8px 6px", fontSize: 13, color: "#666" };
const td = { padding: "10px 6px", fontSize: 14, verticalAlign: "top" };
const lbl = { fontSize: 13, color: "#666", marginBottom: 6 };
const inp = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8, width: "100%" };
const btn = { padding: "7px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 };
const btnPrimary = { padding: "8px 14px", border: "none", borderRadius: 10, background: "#226ad6", color: "#fff", cursor: "pointer", fontWeight: 800 };
const btnDanger = { ...btn, borderColor: "#f2c0c0", background: "#fff0f0", color: "#b00" };
