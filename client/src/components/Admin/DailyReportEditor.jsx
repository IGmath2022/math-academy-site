// client/src/components/Admin/DailyReportEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken, clearAuth } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

const CUSTOM_VALUE = "__custom__";

export default function DailyReportEditor() {
  const navigate = useNavigate();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scope, setScope] = useState("present"); // present | all | missing
  const [list, setList] = useState([]);
  const [studentId, setStudentId] = useState("");

  // 수업형태 옵션
  const [classTypes, setClassTypes] = useState([]);
  // 셀렉트 박스 값(옵션 외 값이면 "__custom__")
  const [classTypeSelect, setClassTypeSelect] = useState("");

  const [form, setForm] = useState({
    course: "",
    book: "",
    content: "",
    homework: "",
    feedback: "",
    tags: "",
    classType: "",   // ← 실제로 저장될 텍스트
    teacher: "",
    headline: "",
    focus: "",
    progressPct: "",
    planNext: "",
  });

  const [msg, setMsg] = useState("");

  // 출결 수동 수정용
  const [inOut, setInOut] = useState({ inTime: "", outTime: "", source: "", studyMin: null });
  const [savingInOut, setSavingInOut] = useState(false);

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate("/login");
      return true;
    }
    return false;
  };

  // ✅ 수업형태 목록 불러오기 — /api/admin/class-types 로 통일
  useEffect(() => {
    const loadClassTypes = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/admin/class-types`, {
          ...withAuth(),
          params: { active: 1 },
        });
        // 서버에서 active 필터가 되더라도 클라이언트에서도 한 번 더 방어
        const names = (data || [])
          .filter((it) => it && (it.active === true || it.active === 1))
          .map((it) => String(it.name || "").trim())
          .filter(Boolean);
        const uniq = Array.from(new Set(names));
        setClassTypes(uniq);
      } catch (e) {
        if (handle401(e)) return;
        // 실패해도 폼은 동작(직접입력 가능)
      }
    };
    loadClassTypes();
    // eslint-disable-next-line
  }, []);

  const fetchList = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/lessons`, {
        params: { date, scope },
        ...withAuth(),
      });
      setList(data?.items || []);
    } catch (e) {
      if (handle401(e)) return;
      setMsg("목록 조회 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  useEffect(() => {
    fetchList();
    setStudentId("");
    // eslint-disable-next-line
  }, [date, scope]);

  // 학생 변경 시 해당일 로그 로드
  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const { data } = await axios.get(`${API_URL}/api/admin/lessons/detail`, {
          params: { studentId, date },
          ...withAuth(),
        });
        const newForm = {
          course: data?.course || "",
          book: data?.book || "",
          content: data?.content || "",
          homework: data?.homework || "",
          feedback: data?.feedback || "",
          tags: (data?.tags || []).join(", "),
          classType: data?.classType || "",
          teacher: data?.teacher || data?.teacherName || "",
          headline: data?.headline || "",
          focus: data?.focus ?? "",
          progressPct: data?.progressPct ?? "",
          planNext: data?.planNext || data?.nextPlan || "",
        };
        setForm(newForm);

        // 셀렉트 값 동기화
        const exists = (val) =>
          !!val && classTypes.some((t) => t.toLowerCase() === String(val).toLowerCase());
        setClassTypeSelect(exists(newForm.classType) ? newForm.classType : (newForm.classType ? CUSTOM_VALUE : ""));
      } catch (e) {
        if (handle401(e)) return;
        setForm({
          course: "",
          book: "",
          content: "",
          homework: "",
          feedback: "",
          tags: "",
          classType: "",
          teacher: "",
          headline: "",
          focus: "",
          progressPct: "",
          planNext: "",
        });
        setClassTypeSelect("");
      }
    };
    load();
    // eslint-disable-next-line
  }, [studentId, date, classTypes]);

  // 학생/날짜 선택 시 출결 조회
  useEffect(() => {
    const loadAttendance = async () => {
      if (!studentId) {
        setInOut({ inTime: "", outTime: "", source: "", studyMin: null });
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/api/admin/attendance/one`, {
          params: { studentId, date },
          ...withAuth(),
        });
        setInOut({
          inTime: data?.checkIn || "",
          outTime: data?.checkOut || "",
          source: data?.source || "",
          studyMin: data?.studyMin ?? null,
        });
      } catch (e) {
        if (handle401(e)) return;
        setInOut({ inTime: "", outTime: "", source: "", studyMin: null });
      }
    };
    loadAttendance();
    // eslint-disable-next-line
  }, [studentId, date]);

  const handleSave = async () => {
    if (!studentId) {
      setMsg("학생을 선택하세요.");
      setTimeout(() => setMsg(""), 1200);
      return;
    }
    try {
      // 기본 예약시각: 내일 10:30 KST
      const d = new Date(date + "T10:30:00");
      const tmr = new Date(d.getTime() + 24 * 60 * 60 * 1000);

      const payload = {
        studentId,
        date,
        course: form.course,
        book: form.book,
        content: form.content,
        homework: form.homework,
        feedback: form.feedback,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        classType: form.classType,  // ← 최종 문자열(옵션/직접입력 모두)
        teacher: form.teacher,
        headline: form.headline,
        focus: form.focus === "" ? undefined : Number(form.focus),
        progressPct: form.progressPct === "" ? undefined : Number(form.progressPct),
        planNext: form.planNext,
        notifyStatus: "대기",
        scheduledAt: tmr,
      };

      await axios.post(`${API_URL}/api/admin/lessons`, payload, withAuth());
      setMsg("저장 완료 (예약: 내일 10:30)");
      setTimeout(() => setMsg(""), 1500);
      fetchList();
    } catch (e) {
      if (handle401(e)) return;
      setMsg(e?.response?.data?.message || "저장 실패");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  // 출결 수동 저장
  const handleSaveInOut = async () => {
    if (!studentId) {
      setMsg("학생을 선택하세요.");
      setTimeout(() => setMsg(""), 1200);
      return;
    }
    setSavingInOut(true);
    try {
      const payload = {
        studentId,
        date,
        checkIn: inOut.inTime || "", // "HH:mm"
        checkOut: inOut.outTime || "",
        overwrite: true,
      };
      const { data } = await axios.post(`${API_URL}/api/admin/attendance/set-times`, payload, withAuth());
      setInOut((prev) => ({ ...prev, studyMin: data?.durationMin ?? prev.studyMin }));
      setMsg("출결 수정 완료");
      setTimeout(() => setMsg(""), 1200);
      fetchList();
    } catch (e) {
      if (handle401(e)) return;
      setMsg(e?.response?.data?.message || "출결 수정 실패");
      setTimeout(() => setMsg(""), 1500);
    } finally {
      setSavingInOut(false);
    }
  };

  const studentOptions = useMemo(() => {
    const arr = [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return arr.map((it) => ({ value: it.studentId, label: `${it.name}${it.hasLog ? " (작성됨)" : ""}` }));
  }, [list]);

  // 수업형태 셀렉트 변경
  const onChangeClassTypeSelect = (val) => {
    setClassTypeSelect(val);
    if (val && val !== CUSTOM_VALUE) {
      setForm((f) => ({ ...f, classType: val }));
    } else if (val !== CUSTOM_VALUE) {
      setForm((f) => ({ ...f, classType: "" }));
    }
  };

  return (
    <div style={{ margin: "12px 0 20px", padding: 16, background: "#fff", border: "1px solid #e6e9f2", borderRadius: 12 }}>
      <b style={{ fontSize: 16 }}>데일리 리포트 작성/수정</b>

      <div style={{ display: "flex", gap: 12, marginTop: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={ipt} />
        <select value={scope} onChange={(e) => setScope(e.target.value)} style={ipt}>
          <option value="present">출석/작성된 학생만</option>
          <option value="missing">출결 미기록 학생만</option>
          <option value="all">전체 학생</option>
        </select>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={ipt}>
          <option value="">학생 선택</option>
          {studentOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button onClick={fetchList} style={btnGhost}>
          목록 새로고침
        </button>
      </div>

      {/* 출결 수동 수정 블록 */}
      <div style={{ border: "1px dashed #ccd3e0", borderRadius: 10, padding: 12, marginBottom: 14, background: "#f9fbff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, color: "#224" }}>출결 수동 수정(관리자)</span>
          <span style={{ color: "#667" }}>현재 근거: {inOut.source ? (inOut.source === "attendance" ? "출결기록" : "리포트로그") : "-"}</span>
          <span style={{ color: "#667" }}>추정 학습시간: {inOut.studyMin == null ? "-" : `${inOut.studyMin}분`}</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#556", fontWeight: 700 }}>등원(HH:MM)</span>
            <input type="time" value={inOut.inTime} onChange={(e) => setInOut((v) => ({ ...v, inTime: e.target.value }))} style={ipt} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#556", fontWeight: 700 }}>하원(HH:MM)</span>
            <input type="time" value={inOut.outTime} onChange={(e) => setInOut((v) => ({ ...v, outTime: e.target.value }))} style={ipt} />
          </label>
          <button onClick={handleSaveInOut} disabled={savingInOut || !studentId} style={btnPrimary}>
            {savingInOut ? "저장 중…" : "출결 적용(덮어쓰기)"}
          </button>
          <div style={{ color: "#889" }}>※ 덮어쓰기는 해당 날짜의 기존 IN/OUT 기록을 정정하여 정확한 학습시간을 재계산합니다.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="과정" value={form.course} onChange={(v) => setForm((f) => ({ ...f, course: v }))} />
        <Field label="교재" value={form.book} onChange={(v) => setForm((f) => ({ ...f, book: v }))} />
        <Area label="수업내용" value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} />
        <Area label="과제" value={form.homework} onChange={(v) => setForm((f) => ({ ...f, homework: v }))} />
        <Area label="개별 피드백" value={form.feedback} onChange={(v) => setForm((f) => ({ ...f, feedback: v }))} />
        <Field label="태그(쉼표 구분)" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />

        {/* ✅ 수업형태: 옵션 + 직접 입력 지원 */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#556", fontWeight: 700 }}>수업형태</span>
          <select
            value={classTypeSelect}
            onChange={(e) => onChangeClassTypeSelect(e.target.value)}
            style={ipt}
          >
            <option value="">선택</option>
            {classTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value={CUSTOM_VALUE}>직접 입력…</option>
          </select>
        </label>
        {classTypeSelect === CUSTOM_VALUE && (
          <Field
            label="수업형태(직접 입력)"
            value={form.classType}
            onChange={(v) => setForm((f) => ({ ...f, classType: v }))}
            placeholder="예: 개별맞춤수업/판서강의/방학특강 등"
          />
        )}

        <Field label="강사표기" value={form.teacher} onChange={(v) => setForm((f) => ({ ...f, teacher: v }))} />
        <Area label="핵심 한줄 요약" value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} />
        <Field label="집중도(0~100)" type="number" value={form.focus} onChange={(v) => setForm((f) => ({ ...f, focus: v }))} placeholder="예: 85" />
        <Field label="진행률(%)" type="number" value={form.progressPct} onChange={(v) => setForm((f) => ({ ...f, progressPct: v }))} placeholder="예: 60" />
        <Area label="다음 수업 계획" value={form.planNext} onChange={(v) => setForm((f) => ({ ...f, planNext: v }))} />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button onClick={handleSave} style={btnPrimary}>
          저장(예약 대기)
        </button>
      </div>
      {msg && <div style={{ marginTop: 8, color: "#226ad6", fontWeight: 700 }}>{msg}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#556", fontWeight: 700 }}>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={ipt} />
    </label>
  );
}
function Area({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#556", fontWeight: 700 }}>{label}</span>
      <textarea value={value} rows={4} onChange={(e) => onChange(e.target.value)} style={{ ...ipt, minHeight: 96 }} />
    </label>
  );
}

const ipt = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccd3e0", fontSize: 14 };
const btnPrimary = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#226ad6", color: "#fff", fontWeight: 800 };
const btnGhost = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ccd3e0", background: "#fff", color: "#246", fontWeight: 700 };
