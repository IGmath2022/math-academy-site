import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken, clearAuth } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

/** 유틸 */
const ymd = (d = new Date()) => d.toISOString().slice(0, 10);
const ym = (d = new Date()) => d.toISOString().slice(0, 7);
function daysInMonthStr(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const arr = [];
  for (let i = 1; i <= last; i++) {
    const dd = String(i).padStart(2, "0");
    arr.push(`${yyyyMM}-${dd}`);
  }
  return arr;
}
const fmt = {
  text(s) {
    const t = String(s || "").trim();
    return t ? t : "-";
  },
};

/** 메인 */
export default function ProgressManager() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("date"); // date | studentMonth

  // 공통 인증
  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate("/login");
      return true;
    }
    return false;
  };

  /** ==== 날짜별 보기 ==== */
  const [date, setDate] = useState(() => ymd());
  const [dateRows, setDateRows] = useState([]);
  const [loadingDate, setLoadingDate] = useState(false);

  const fetchByDate = async () => {
    setLoadingDate(true);
    try {
      // 1) 해당 날짜 학생 리스트(로그 존재 여부 포함)
      const { data } = await axios.get(`${API_URL}/api/admin/lessons`, {
        params: { date, scope: "present" },
        ...withAuth(),
      });
      const items = data?.items || [];

      // 2) hasLog 학생만 상세 조회 → planNext/teacher 등 획득
      const enriched = await Promise.all(
        items.map(async (row) => {
          if (!row.hasLog) {
            // 출결만 있고 리포트 없음
            return {
              mode: "현강",
              date,
              studentId: row.studentId,
              studentName: row.name,
              course: "",
              content: "",
              homework: "",
              planNext: "",
              teacher: "",
              isReport: false,
            };
          }
          try {
            const det = await axios.get(`${API_URL}/api/admin/lessons/detail`, {
              params: { studentId: row.studentId, date },
              ...withAuth(),
            });
            const log = det.data || {};
            return {
              mode: "현강",
              date,
              studentId: row.studentId,
              studentName: row.name,
              course: log.course || "",
              content: log.content || "",
              homework: log.homework || "",
              planNext: log.planNext || log.nextPlan || "",
              teacher: log.teacher || log.teacherName || "",
              isReport: true,
            };
          } catch (e) {
            if (handle401(e)) return null;
            return {
              mode: "현강",
              date,
              studentId: row.studentId,
              studentName: row.name,
              course: "",
              content: "",
              homework: "",
              planNext: "",
              teacher: "",
              isReport: true,
            };
          }
        })
      );

      setDateRows(enriched.filter(Boolean).sort((a, b) => (a.studentName || "").localeCompare(b.studentName || "", "ko")));
    } catch (e) {
      if (handle401(e)) return;
      setDateRows([]);
    } finally {
      setLoadingDate(false);
    }
  };

  useEffect(() => {
    if (tab === "date") fetchByDate();
    // eslint-disable-next-line
  }, [tab, date]);

  /** ==== 학생별(월) 보기 ==== */
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(() => ym());
  const [monthRows, setMonthRows] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [chaptersMap, setChaptersMap] = useState({}); // 인강 표시용

  // 학생/챕터 로딩
  useEffect(() => {
    (async () => {
      try {
        const tokenHdr = withAuth();
        const [usersRes, chaptersRes] = await Promise.all([
          axios.get(`${API_URL}/api/users?role=student`, tokenHdr),
          axios.get(`${API_URL}/api/chapters`, tokenHdr),
        ]);
        const sorted = (usersRes.data || []).sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
        setStudents(sorted);
        const cmap = {};
        (chaptersRes.data || []).forEach((c) => {
          cmap[String(c._id || c.id)] = c;
        });
        setChaptersMap(cmap);
      } catch (e) {
        if (handle401(e)) return;
      }
    })();
    // eslint-disable-next-line
  }, []);

  const selectedStudentName = useMemo(
    () => students.find((s) => String(s._id) === String(studentId))?.name || "",
    [students, studentId]
  );

  const fetchMonthForStudent = async () => {
    if (!studentId) {
      setMonthRows([]);
      return;
    }
    setLoadingMonth(true);
    try {
      const tokenHdr = withAuth();
      const days = daysInMonthStr(month);

      // 1) 현강(일일리포트) 수집
      const dayDetails = await Promise.all(
        days.map(async (d) => {
          try {
            const { data } = await axios.get(`${API_URL}/api/admin/lessons/detail`, {
              params: { studentId, date: d },
              ...tokenHdr,
            });
            if (!data || Object.keys(data).length === 0) return null;
            return {
              mode: "현강",
              date: d,
              studentId,
              studentName: selectedStudentName,
              course: data.course || "",
              content: data.content || "",
              homework: data.homework || "",
              planNext: data.planNext || data.nextPlan || "",
              teacher: data.teacher || data.teacherName || "",
            };
          } catch (e) {
            if (handle401(e)) return null;
            return null;
          }
        })
      );

      // 2) 인강(진도 API) 수집 → 같은 달만 필터
      const progRes = await axios.get(`${API_URL}/api/progress`, tokenHdr);
      const allProg = progRes.data || [];
      const myProg = allProg.filter(
        (p) => String(p.userId) === String(studentId) && String(p.date || "").startsWith(month)
      );

      const indangRows = myProg.map((p) => {
        const chId = String(p.chapterId?._id || p.chapterId || "");
        const ch = chaptersMap[chId];
        return {
          mode: "인강",
          date: p.date || "",
          studentId,
          studentName: selectedStudentName,
          course: ch?.name || chId || "",
          content: p.memo || "",
          homework: "",
          planNext: "", // 인강에는 다음수업계획 개념 없음
          teacher: "",  // 인강에는 강사 표시 없음
        };
      });

      const merged = [...dayDetails.filter(Boolean), ...indangRows].sort((a, b) =>
        (a.date || "").localeCompare(b.date || "")
      );
      setMonthRows(merged);
    } catch (e) {
      if (handle401(e)) return;
      setMonthRows([]);
    } finally {
      setLoadingMonth(false);
    }
  };

  useEffect(() => {
    if (tab === "studentMonth") fetchMonthForStudent();
    // eslint-disable-next-line
  }, [tab, studentId, month]);

  /** 렌더 */
  return (
    <div
      style={{
        border: "1px solid #e5e8ec",
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
        boxShadow: "0 2px 10px #0001",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 19 }}>진도 관리</h3>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("date")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: tab === "date" ? "#226ad6" : "#eef2f7",
            color: tab === "date" ? "#fff" : "#223",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          날짜별 보기
        </button>
        <button
          onClick={() => setTab("studentMonth")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: tab === "studentMonth" ? "#226ad6" : "#eef2f7",
            color: tab === "studentMonth" ? "#fff" : "#223",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          학생별 월 보기
        </button>
      </div>

      {/* 날짜별 */}
      {tab === "date" && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #ccd3e0" }}
            />
            <button onClick={fetchByDate} style={btnGhost}>
              새로고침
            </button>
          </div>
          {loadingDate ? (
            <div style={{ color: "#888" }}>불러오는 중…</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f6ff" }}>
                    <Th>구분</Th>
                    <Th>날짜</Th>
                    <Th>학생</Th>
                    <Th>과정</Th>
                    <Th>수업내용</Th>
                    <Th>과제</Th>
                    <Th>다음 수업 계획</Th>
                    <Th>강사</Th>
                  </tr>
                </thead>
                <tbody>
                  {dateRows.length === 0 ? (
                    <tr>
                      <Td colSpan={8} style={{ textAlign: "center", color: "#888" }}>
                        표시할 기록이 없습니다.
                      </Td>
                    </tr>
                  ) : (
                    dateRows.map((r, i) => (
                      <tr key={`${r.studentId}-${i}`}>
                        <Td>{r.mode}</Td>
                        <Td>{r.date}</Td>
                        <Td>{fmt.text(r.studentName)}</Td>
                        <Td>{fmt.text(r.course)}</Td>
                        <Td>{fmt.text(r.content)}</Td>
                        <Td>{fmt.text(r.homework)}</Td>
                        <Td>{fmt.text(r.planNext)}</Td>
                        <Td>{fmt.text(r.teacher)}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 학생별 월 */}
      {tab === "studentMonth" && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #ccd3e0", minWidth: 160 }}
            >
              <option value="">학생 선택</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #ccd3e0" }}
            />
            <button onClick={fetchMonthForStudent} disabled={!studentId} style={btnGhost}>
              불러오기
            </button>
          </div>

          {loadingMonth ? (
            <div style={{ color: "#888" }}>불러오는 중…</div>
          ) : !studentId ? (
            <div style={{ color: "#888" }}>학생과 월을 선택하세요.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f6ff" }}>
                    <Th>구분</Th>
                    <Th>날짜</Th>
                    <Th>학생</Th>
                    <Th>과정/단원</Th>
                    <Th>수업내용/메모</Th>
                    <Th>과제</Th>
                    <Th>다음 수업 계획</Th>
                    <Th>강사</Th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.length === 0 ? (
                    <tr>
                      <Td colSpan={8} style={{ textAlign: "center", color: "#888" }}>
                        표시할 기록이 없습니다.
                      </Td>
                    </tr>
                  ) : (
                    monthRows.map((r, i) => (
                      <tr key={`${r.mode}-${r.date}-${i}`}>
                        <Td>{r.mode}</Td>
                        <Td>{r.date}</Td>
                        <Td>{fmt.text(r.studentName)}</Td>
                        <Td>{fmt.text(r.course)}</Td>
                        <Td>{fmt.text(r.content)}</Td>
                        <Td>{fmt.text(r.homework)}</Td>
                        <Td>{fmt.text(r.planNext)}</Td>
                        <Td>{fmt.text(r.teacher)}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 테이블 셀 */
function Th({ children }) {
  return (
    <th
      style={{
        borderBottom: "1px solid #e9edf7",
        padding: "10px 8px",
        textAlign: "left",
        fontSize: 14,
        color: "#334",
      }}
    >
      {children}
    </th>
  );
}
function Td({ children, colSpan, style }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        borderBottom: "1px solid #f1f3fa",
        padding: "10px 8px",
        textAlign: "left",
        fontSize: 14,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

const btnGhost = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ccd3e0",
  background: "#fff",
  color: "#246",
  fontWeight: 700,
  cursor: "pointer",
};
