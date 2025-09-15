// client/src/components/Admin/ProgressManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import useAuthHeader from "../../utils/useAuthHeader";
import { toYmdLocal, toYmLocal } from "../../utils/dateKST";

/** 유틸: 해당 YYYY-MM의 모든 일자(YYYY-MM-DD 배열) */
function listMonthDates(ym) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const res = [];
  for (let d = 1; d <= last.getDate(); d++) res.push(`${y}-${pad(m)}-${pad(d)}`);
  return res;
}

function Badge({ type }) {
  const map = {
    class: { label: "현강", bg: "#e8f5ff", fg: "#1363c6" },
    video: { label: "인강", bg: "#ecf9f1", fg: "#18794e" },
  };
  const s = map[type] || map.class;
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.fg}30`,
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 800,
        marginRight: 8,
      }}
    >
      {s.label}
    </span>
  );
}

function FeedCard({ item }) {
  return (
    <div
      style={{
        border: "1px solid #e6e9f2",
        background: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Badge type={item.type} />
          <b style={{ fontSize: 16 }}>{item.studentName}</b>
        </div>
        <div style={{ color: "#567" }}>{item.date}</div>
      </div>

      {item.type === "class" ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#345", marginBottom: 6 }}>
            <b>과정</b> : {item.course || "-"}
          </div>
          <div style={{ color: "#345", marginBottom: 6 }}>
            <b>수업내용</b> : {item.content || "-"}
          </div>
          <div style={{ color: "#345", marginBottom: 6 }}>
            <b>과제</b> : {item.homework || "-"}
          </div>
          <div style={{ color: "#345", marginBottom: 6 }}>
            <b>다음 수업 계획</b> : {item.nextPlan || "-"}
          </div>
          <div style={{ color: "#678" }}>
            <b>강사</b> : {item.teacher || "-"}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#345", marginBottom: 6 }}>
            <b>수강 단원</b> : {item.chapterName || "-"}
          </div>
          <div style={{ color: "#345" }}>
            <b>메모</b> : {item.memo || "-"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProgressManager() {
  const auth = useAuthHeader();

  // 공통 매핑 데이터
  const [students, setStudents] = useState([]);
  const [chapters, setChapters] = useState([]);
  const studentName = (id) =>
    students.find((s) => (s._id || s.id) === id)?.name || id;
  const chapterName = (id) =>
    chapters.find((c) => (c._id || c.id) === id)?.name || id;

  useEffect(() => {
    const run = async () => {
      try {
        const [stuRes, chRes] = await Promise.all([
          axios.get(`${API_URL}/api/users?role=student`, auth),
          axios.get(`${API_URL}/api/chapters`, auth),
        ]);
        setStudents(stuRes.data || []);
        setChapters(chRes.data || []);
      } catch {}
    };
    run();
  }, [auth]);

  /* ------------------ 탭: 날짜별 / 학생별 ------------------ */
  const [tab, setTab] = useState("byDate"); // byDate | byStudent

  /* ------------------ 날짜별 피드 ------------------ */
  const [date, setDate] = useState(() => toYmdLocal(new Date()));
  const [typeFilter, setTypeFilter] = useState("all"); // all | class | video
  const [feed, setFeed] = useState([]);
  const [loadingDate, setLoadingDate] = useState(false);

  const loadFeedByDate = async () => {
    setLoadingDate(true);
    try {
      const list = [];

      // 1) 현강(리포트) — 날짜의 학생들 중 hasLog인 학생들로 상세 조회
      const { data: byDate } = await axios.get(
        `${API_URL}/api/admin/lessons?date=${date}&scope=present`,
        auth
      );
      const rows = byDate?.items || [];
      const logRows = rows.filter((r) => r.hasLog && r.logId);

      const details = await Promise.all(
        logRows.map((r) =>
          axios
            .get(`${API_URL}/api/admin/lessons/detail`, {
              ...auth,
              params: { studentId: r.studentId, date },
            })
            .then((res) => ({ r, d: res.data || {} }))
            .catch(() => ({ r, d: {} }))
        )
      );

      details.forEach(({ r, d }) => {
        list.push({
          type: "class",
          date,
          studentId: r.studentId,
          studentName: r.name || studentName(r.studentId),
          course: d.course || "",
          content: d.content || "",
          homework: d.homework || "",
          // ✅ planNext / nextPlan 모두 대응
          nextPlan: d.planNext || d.nextPlan || "",
          teacher: d.teacher || d.teacherName || "",
        });
      });

      // 2) 인강(진도) — 해당 날짜만
      const { data: progressAll } = await axios.get(
        `${API_URL}/api/progress`,
        auth
      );
      (progressAll || [])
        .filter((p) => p.date === date)
        .forEach((p) => {
          list.push({
            type: "video",
            date: p.date,
            studentId: p.userId,
            studentName: studentName(p.userId),
            chapterName: chapterName(p.chapterId),
            memo: p.memo || "",
          });
        });

      // 정렬
      list.sort((a, b) => {
        const n = (a.studentName || "").localeCompare(
          b.studentName || "",
          "ko"
        );
        if (n) return n;
        if (a.type !== b.type) return a.type === "class" ? -1 : 1;
        return 0;
      });

      setFeed(list);
    } catch {
      setFeed([]);
    } finally {
      setLoadingDate(false);
    }
  };

  useEffect(() => {
    if (tab === "byDate") loadFeedByDate();
    // eslint-disable-next-line
  }, [tab, date]);

  const filteredByDate = useMemo(() => {
    if (typeFilter === "all") return feed;
    return feed.filter((f) => f.type === typeFilter);
  }, [feed, typeFilter]);

  /* ------------------ 학생별(월) 피드 ------------------ */
  const [selStudent, setSelStudent] = useState("");
  const [month, setMonth] = useState(() => toYmLocal(new Date()));
  const [studentFeed, setStudentFeed] = useState([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentTypeFilter, setStudentTypeFilter] = useState("all");

  // 월간 현강 로그 수집 (가능하면 서버 집계 API, 없으면 일자별 detail 폴백)
  async function fetchClassLogsMonthly(studentId, ym) {
    // 1) 집계 엔드포인트 시도
    try {
      const res = await axios.get(`${API_URL}/api/admin/lessons/by-student`, {
        ...auth,
        params: { studentId, month: ym },
      });
      if (Array.isArray(res.data?.items)) {
        // 서버가 {date, course, content, homework, planNext/nextPlan, teacher} 등으로 내려주는 경우
        return res.data.items.map((d) => ({
          type: "class",
          date: d.date,
          studentId,
          studentName: studentName(studentId),
          course: d.course || "",
          content: d.content || "",
          homework: d.homework || "",
          nextPlan: d.planNext || d.nextPlan || "",
          teacher: d.teacher || d.teacherName || "",
        }));
      }
    } catch {
      // 통과 → 폴백
    }

    // 2) 폴백: 해당 월의 모든 날짜에 대해 lessons/detail 조회
    const days = listMonthDates(ym);
    const promises = days.map((d) =>
      axios
        .get(`${API_URL}/api/admin/lessons/detail`, {
          ...auth,
          params: { studentId, date: d },
        })
        .then((res) => ({ date: d, det: res.data || {} }))
        .catch(() => ({ date: d, det: null }))
    );
    const results = await Promise.all(promises);

    return results
      .filter((r) => r.det && r.det.studentId) // 로그가 있을 때만
      .map((r) => ({
        type: "class",
        date: r.date,
        studentId,
        studentName: studentName(studentId),
        course: r.det.course || "",
        content: r.det.content || "",
        homework: r.det.homework || "",
        nextPlan: r.det.planNext || r.det.nextPlan || "",
        teacher: r.det.teacher || r.det.teacherName || "",
      }));
  }

  async function fetchVideoLogsMonthly(studentId, ym) {
    // /api/progress?userId= 로 개인 전체를 가져와서 월 필터
    const { data } = await axios.get(
      `${API_URL}/api/progress`,
      {
        ...auth,
        params: { userId: studentId },
      }
    );
    const arr = Array.isArray(data) ? data : data || [];
    return arr
      .filter((p) => typeof p.date === "string" && p.date.startsWith(ym))
      .map((p) => ({
        type: "video",
        date: p.date,
        studentId,
        studentName: studentName(studentId),
        chapterName: chapterName(p.chapterId),
        memo: p.memo || "",
      }));
  }

  const loadFeedByStudent = async () => {
    if (!selStudent) return;
    setLoadingStudent(true);
    try {
      const [classLogs, videoLogs] = await Promise.all([
        fetchClassLogsMonthly(selStudent, month),
        fetchVideoLogsMonthly(selStudent, month),
      ]);
      const list = [...classLogs, ...videoLogs].sort((a, b) =>
        a.date === b.date
          ? a.type === b.type
            ? 0
            : a.type === "class"
            ? -1
            : 1
          : a.date.localeCompare(b.date)
      );
      setStudentFeed(list);
    } catch {
      setStudentFeed([]);
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    if (tab === "byStudent" && selStudent) loadFeedByStudent();
    // eslint-disable-next-line
  }, [tab, selStudent, month]);

  const filteredByStudent = useMemo(() => {
    if (studentTypeFilter === "all") return studentFeed;
    return studentFeed.filter((f) => f.type === studentTypeFilter);
  }, [studentFeed, studentTypeFilter]);

  /* ------------------ Render ------------------ */
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e6e9f2",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <h3 style={{ margin: "0 0 12px 0" }}>진도 관리 (현강/인강 통합 피드)</h3>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("byDate")}
          style={tabBtn(tab === "byDate")}
        >
          날짜별
        </button>
        <button
          onClick={() => setTab("byStudent")}
          style={tabBtn(tab === "byStudent")}
        >
          학생별(월)
        </button>
      </div>

      {/* 날짜별 */}
      {tab === "byDate" && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={ipt}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={ipt}
            >
              <option value="all">전체</option>
              <option value="class">현강만</option>
              <option value="video">인강만</option>
            </select>
            <button onClick={loadFeedByDate} style={btnGhost}>
              새로고침
            </button>
          </div>

          {loadingDate ? (
            <div style={{ color: "#888" }}>불러오는 중…</div>
          ) : filteredByDate.length === 0 ? (
            <div style={{ color: "#999" }}>표시할 기록이 없습니다.</div>
          ) : (
            filteredByDate.map((it, idx) => <FeedCard key={idx} item={it} />)
          )}
        </>
      )}

      {/* 학생별(월) */}
      {tab === "byStudent" && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <select
              value={selStudent}
              onChange={(e) => setSelStudent(e.target.value)}
              style={ipt}
            >
              <option value="">학생 선택</option>
              {students
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "ko"))
                .map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={ipt}
            />
            <select
              value={studentTypeFilter}
              onChange={(e) => setStudentTypeFilter(e.target.value)}
              style={ipt}
            >
              <option value="all">전체</option>
              <option value="class">현강만</option>
              <option value="video">인강만</option>
            </select>
            <button
              onClick={loadFeedByStudent}
              disabled={!selStudent}
              style={btnGhost}
            >
              새로고침
            </button>
          </div>

          {loadingStudent ? (
            <div style={{ color: "#888" }}>불러오는 중…</div>
          ) : !selStudent ? (
            <div style={{ color: "#999" }}>학생을 선택하세요.</div>
          ) : filteredByStudent.length === 0 ? (
            <div style={{ color: "#999" }}>
              {month}에 표시할 기록이 없습니다.
            </div>
          ) : (
            filteredByStudent.map((it, idx) => <FeedCard key={idx} item={it} />)
          )}
        </>
      )}
    </div>
  );
}

/* 스타일 */
const ipt = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #ccd3e0",
  fontSize: 14,
  background: "#fff",
};
const btnGhost = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ccd3e0",
  background: "#fff",
  color: "#246",
  fontWeight: 700,
  cursor: "pointer",
};
const tabBtn = (active) => ({
  padding: "9px 18px",
  borderRadius: 9,
  border: "none",
  background: active ? "#226ad6" : "#eef2f7",
  color: active ? "#fff" : "#234",
  fontWeight: 800,
  cursor: "pointer",
});
