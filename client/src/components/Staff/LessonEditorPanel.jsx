// client/src/components/Staff/LessonEditorPanel.jsx
import React, { useEffect, useState } from "react";
import { getLessonDetail, upsertLesson } from "../../utils/staffApi";
import { listClassTypes } from "../../utils/classTypeApi";

/**
 * 간단한 리포트 에디터
 * props:
 *  - student: { id, name }
 *  - date: 'YYYY-MM-DD'
 *  - onSaved?: (doc) => void
 */
export default function LessonEditorPanel({ student, date, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [types, setTypes] = useState([]);

  const [form, setForm] = useState({
    studentId: student?.id,
    date,
    course: "",
    book: "",
    content: "",
    homework: "",
    feedback: "",
    planNext: "",
    teacher: "",
    classType: "", // ← 수업형태
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [detail, ctList] = await Promise.all([
          getLessonDetail({ studentId: student.id, date }),
          listClassTypes().catch(() => []),
        ]);
        setTypes((ctList || []).filter(c => c.active).sort((a,b)=> (a.order??0)-(b.order??0)));
        setForm(prev => ({
          ...prev,
          studentId: student.id,
          date,
          course: detail?.course || "",
          book: detail?.book || "",
          content: detail?.content || "",
          homework: detail?.homework || "",
          feedback: detail?.feedback || "",
          planNext: detail?.planNext || detail?.nextPlan || "",
          teacher: detail?.teacher || "",
          classType: detail?.classType || "",
        }));
      } catch (e) {
        setErr("불러오기 실패");
        setTimeout(()=>setErr(""), 2000);
      } finally {
        setLoading(false);
      }
    })();
  }, [student?.id, date]);

  const save = async () => {
    try {
      setSaving(true);
      setMsg("");
      setErr("");
      const payload = { ...form };
      const res = await upsertLesson(payload);
      setMsg("저장되었습니다.");
      setTimeout(()=>setMsg(""), 1400);
      onSaved && onSaved(res?.doc || null);
    } catch (e) {
      setErr("저장 실패");
      setTimeout(()=>setErr(""), 1800);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Panel><Muted>불러오는 중…</Muted></Panel>;

  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>{student?.name} / {date}</strong>
        <div>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      {msg && <Alert ok>{msg}</Alert>}
      {err && <Alert>{err}</Alert>}

      <Grid>
        <Field label="수업형태">
          <select
            value={form.classType}
            onChange={e => setForm(f => ({ ...f, classType: e.target.value }))}
            style={inp}
          >
            <option value="">선택</option>
            {types.map(t => (
              <option key={t._id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </Field>

        <Field label="과정">
          <input value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} style={inp} />
        </Field>

        <Field label="교재">
          <input value={form.book} onChange={e => setForm(f => ({ ...f, book: e.target.value }))} style={inp} />
        </Field>

        <Field label="강사명">
          <input value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} style={inp} />
        </Field>

        <FieldWide label="수업내용">
          <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={ta} />
        </FieldWide>

        <FieldWide label="과제">
          <textarea rows={3} value={form.homework} onChange={e => setForm(f => ({ ...f, homework: e.target.value }))} style={ta} />
        </FieldWide>

        <FieldWide label="개별 피드백">
          <textarea rows={3} value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} style={ta} />
        </FieldWide>

        <FieldWide label="다음 수업 계획 (planNext)">
          <textarea rows={3} value={form.planNext} onChange={e => setForm(f => ({ ...f, planNext: e.target.value }))} style={ta} />
        </FieldWide>
      </Grid>
    </Panel>
  );
}

/* ------- UI bits ------- */
const Panel = ({ children }) => (
  <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:14, marginBottom:12 }}>
    {children}
  </div>
);
const Muted = ({ children }) => <div style={{ color:"#888", textAlign:"center" }}>{children}</div>;
const Alert = ({ ok, children }) => (
  <div style={{
    margin:"6px 0 10px 0",
    padding:"8px 12px",
    borderRadius:8,
    background: ok ? "#edf7ee" : "#fff2f2",
    color: ok ? "#166534" : "#b42318",
    border: ok ? "1px solid #cce7d0" : "1px solid #ffd6d6",
    fontWeight:600
  }}>{children}</div>
);
const Field = ({ label, children }) => (
  <div>
    <div style={{ fontSize:13, color:"#666", marginBottom:6 }}>{label}</div>
    {children}
  </div>
);
const FieldWide = Field;
const Grid = ({ children }) => (
  <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap:12 }}>{children}</div>
);
const inp = { padding:"8px 10px", border:"1px solid #ccc", borderRadius:8, width:"100%" };
const ta  = { padding:"8px 10px", border:"1px solid #ccc", borderRadius:8, width:"100%", resize:"vertical" };
const btnPrimary = { padding:"8px 14px", border:"none", borderRadius:10, background:"#226ad6", color:"#fff", cursor:"pointer", fontWeight:800 };
