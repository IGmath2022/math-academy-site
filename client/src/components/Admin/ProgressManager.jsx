// client/src/components/Admin/ProgressManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import useAuthHeader from "../../utils/useAuthHeader";
import { toYmdLocal } from "../../utils/dateKST";

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

  // 날짜별 피드
  const [date, setDate] = useState(() => toYmdLocal(new Date()));
  const [typeFilter, setTypeFilter] = useState("all"); // all | class | video
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);

  // 매핑용
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
      } catch (e) {
        // ignore
      }
    };
    run();
  }, [auth]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const list = [];

      // 1) 현강(리포트)
      const { data: byDate } = await axios.get(
        `${API_URL}/api/admin/lessons?date=${date}&scope=present`,
        auth
      );
      const rows = byDate?.items || [];
      const logRows = rows.filter((r) => r.hasLog && r.logId);

      // 상세 병렬 수집
      const detailPromises = logRows.map((r) =>
        axios
          .get(`${API_URL}/api/admin/lessons/detail`, {
            ...auth,
            params: { studentId: r.studentId, date },
          })
          .then((res) => ({ r, detail: res.data || {} }))
          .catch(() => ({ r, detail: {} }))
      );
      const details = await Promise.all(detailPromises);

      details.forEach(({ r, detail }) => {
        list.push({
          type: "class",
          date,
          studentId: r.studentId,
          studentName: r.name || studentName(r.studentId),
          course: detail.course || "",
          content: detail.content || "",
          homework: detail.homework || "",
          nextPlan: detail.planNext || detail.nextPlan || "",
          teacher: detail.teacher || detail.teacherName || "",
        });
      });

      // 2) 인강(진도)
      const { data: progressAll } = await axios.get(
        `${API_URL}/api/progress`,
        auth
      );
      const prog = (progressAll || []).filter((p) => p.date === date);
      prog.forEach((p) => {
        list.push({
          type: "video",
          date: p.date,
          studentId: p.userId,
          studentName: studentName(p.userId),
          chapterName: chapterName(p.chapterId),
          memo: p.memo || "",
        });
      });

      // 정렬(학생명 → 타입)
      list.sort((a, b) => {
        const n = (a.studentName || "").localeCompare(
          b.studentName || "",
          "ko"
        );
        if (n) return n;
        // class 먼저
        if (a.type !== b.type) return a.type === "class" ? -1 : 1;
        return 0;
      });

      setFeed(list);
    } catch (e) {
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line
  }, [date]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return feed;
    return feed.filter((f) => f.type === typeFilter);
  }, [feed, typeFilter]);

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
        <button onClick={loadFeed} style={btnGhost}>
          새로고침
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#888" }}>불러오는 중…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#999" }}>표시할 기록이 없습니다.</div>
      ) : (
        filtered.map((it, idx) => <FeedCard key={idx} item={it} />)
      )}
    </div>
  );
}

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
