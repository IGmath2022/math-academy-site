// client/src/components/Admin/StudentManager.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import StudentProgressCalendar from "../Student/StudentProgressCalendar";
import { API_URL } from '../../api';

/** ───────────────────────────────────────────────────────────
 *  Presentational-only 개선:
 *  - 카드형 레이아웃, 넓은 인풋/버튼, 일관된 타이포
 *  - 기능/로직/엔드포인트/모달/검색/필터는 기존 그대로
 *  ─────────────────────────────────────────────────────────── */

function StudentCalendarView({ userId }) {
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chaptersMap, setChaptersMap] = useState({});

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const tokenHdr = { headers: { Authorization: `Bearer ${token}` } };

      // 1) 온라인 진도 (인강) 가져오기
      const progressRes = await axios.get(`${API_URL}/api/progress`, tokenHdr);
      const allProgress = progressRes.data || [];
      const myProgress = allProgress.filter(p => String(p.userId) === String(userId));

      // 2) 현강 데이터 가져오기 - 최근 90일간의 일일리포트 데이터
      const recentDates = [];
      for (let i = 0; i < 90; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        recentDates.push(date.toISOString().slice(0, 10));
      }

      const attendanceData = [];
      await Promise.all(
        recentDates.map(async (date) => {
          try {
            const { data } = await axios.get(`${API_URL}/api/admin/lessons/detail`, {
              params: { studentId: userId, date },
              ...tokenHdr,
            });
            if (data && Object.keys(data).length > 0) {
              attendanceData.push({
                date,
                course: data.course || "",
                content: data.content || "",
                homework: data.homework || "",
                planNext: data.planNext || data.nextPlan || "",
                teacher: data.teacher || data.teacherName || "",
              });
            }
          } catch (e) {
            // 데이터가 없는 날은 무시
          }
        })
      );

      // 3) 챕터 맵 생성 (온라인 진도용)
      const chapters = {};
      myProgress.forEach(p => {
        if (p.chapterId && typeof p.chapterId === 'object') {
          chapters[p.chapterId._id] = p.chapterId;
        } else if (p.chapter) {
          chapters[p.chapterId || 'unknown'] = p.chapter;
        }
      });

      setProgress(myProgress);
      setAttendance(attendanceData);
      setChaptersMap(chapters);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("캘린더 데이터 조회 실패:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCalendarData(); }, [userId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>캘린더 데이터를 불러오는 중...</div>;
  }

  return (
    <StudentProgressCalendar
      progressList={progress}
      chaptersMap={chaptersMap}
      attendanceList={attendance}
    />
  );
}

function StudentProgressHistory({ userId, onClose }) {
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const tokenHdr = { headers: { Authorization: `Bearer ${token}` } };

      // 1) 온라인 진도 (인강) 가져오기
      const progressRes = await axios.get(`${API_URL}/api/progress`, tokenHdr);
      const allProgress = progressRes.data || [];
      const myProgress = allProgress.filter(p => String(p.userId) === String(userId));

      // 2) 현강 데이터 가져오기 - 최근 30일간의 일일리포트 데이터
      const recentDates = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        recentDates.push(date.toISOString().slice(0, 10));
      }

      const attendanceData = [];
      await Promise.all(
        recentDates.map(async (date) => {
          try {
            const { data } = await axios.get(`${API_URL}/api/admin/lessons/detail`, {
              params: { studentId: userId, date },
              ...tokenHdr,
            });
            if (data && Object.keys(data).length > 0) {
              attendanceData.push({
                date,
                course: data.course || "",
                content: data.content || "",
                homework: data.homework || "",
                planNext: data.planNext || data.nextPlan || "",
                teacher: data.teacher || data.teacherName || "",
              });
            }
          } catch (e) {
            // 데이터가 없는 날은 무시
          }
        })
      );

      setProgress(myProgress);
      setAttendance(attendanceData);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("학생 이력 조회 실패:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  // 온라인 진도와 현강 기록을 날짜순으로 정렬하여 통합
  const combinedHistory = [
    ...progress.map(p => ({
      ...p,
      type: 'online',
      date: p.date,
      display: `인강: ${p.chapterId?.name || p.chapter?.title || '-'} ${p.memo ? '- ' + p.memo : ''}`
    })),
    ...attendance.map(a => ({
      ...a,
      type: 'attendance',
      date: a.date,
      display: `현강: ${a.course || '수업'} ${a.content ? '- ' + a.content : ''} ${a.teacher ? '(' + a.teacher + ')' : ''}`
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ padding: 16 }}>
      <h4 style={{ margin: 0, marginBottom: 10, color: "#0f172a" }}>진행 이력 (온라인 + 현강)</h4>
      {loading ? (
        <div style={{ color: "#64748b" }}>불러오는 중…</div>
      ) : combinedHistory.length === 0 ? (
        <div style={{ color: "#94a3b8" }}>기록 없음</div>
      ) : (
        <ul style={{ fontSize: 14, padding: 0, margin: 0, listStyle: "none", maxHeight: '400px', overflowY: 'auto' }}>
          {combinedHistory.map((item, index) => (
            <li key={`${item.type}-${item._id || index}`} style={{
              padding: "8px 0",
              borderBottom: "1px dashed #e2e8f0",
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: item.type === 'online' ? '#1d4ed8' : '#059669',
                  fontWeight: '500',
                  marginBottom: '2px'
                }}>
                  {item.display}
                </div>
              </div>
              <div style={{ color: "#64748b", fontSize: "12px", marginLeft: "8px" }}>
                {item.date ? String(item.date).slice(0, 10) : "-"}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 12, textAlign: "right" }}>
        <button onClick={onClose} style={styles.btnGhost}>닫기</button>
      </div>
    </div>
  );
}

function StudentDetailModal({ student, onClose }) {
  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalCard}>
        <div style={styles.modalHeader}>학생 상세</div>
        <div style={{ padding: 16 }}>
          <div style={styles.grid2}>
            <Field label="이름" value={student.name} />
            <Field label="전화" value={student.phone} />
            <Field label="학년" value={student.grade} />
            <Field label="학교" value={student.school?.name || student.schoolName || "-"} />
            <Field label="학부모" value={student.parentName ?? "-"} />
            <Field label="학부모 연락처" value={student.parentPhone ?? "-"} />
            <Field label="메모" value={student.memo ?? "-"} />
            <Field label="상태" value={student.active ? "활성" : "비활성"} />
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnGhost}>닫기</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function StudentManager() {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [chapters, setChapters] = useState([]); // (기존 로직 유지: 필요 데이터로딩)
  const [showInactive, setShowInactive] = useState(false);
  const [q, setQ] = useState("");

  // 폼 상태 (기존 필드/로직/엔드포인트 동일)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    grade: "",
    schoolId: "",
    parentName: "",
    parentPhone: "",
    memo: "",
    active: true
  });

  const [editingId, setEditingId] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [historyUserId, setHistoryUserId] = useState(null);
  const [calendarStudent, setCalendarStudent] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 데이터 로딩 (기존 API/쿼리 동일)
  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    const url =
      `${API_URL}/api/users?role=student` +
      (showInactive ? "&includeInactive=1" : "") +
      (q ? `&q=${encodeURIComponent(q)}` : "");
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    setStudents(res.data || []);
  };
  const fetchSchools = async () => {
    const res = await axios.get(`${API_URL}/api/schools`, getAuthConfig());
    setSchools(res.data || []);
  };
  const fetchChapters = async () => {
    const res = await axios.get(`${API_URL}/api/chapters`, getAuthConfig());
    setChapters(res.data || []);
  };

  useEffect(() => { fetchSchools(); fetchChapters(); }, []);
  useEffect(() => { fetchStudents(); }, [q, showInactive]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      grade: "",
      schoolId: "",
      parentName: "",
      parentPhone: "",
      memo: "",
      active: true
    });
    setEditingId(null);
  };

  const handleAdd = async () => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_URL}/api/users`, { ...form, role: "student" }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    resetForm();
    fetchStudents();
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setForm({
      name: student.name ?? "",
      phone: student.phone ?? "",
      grade: student.grade ?? "",
      schoolId: student.schoolId || student.school?._id || "",
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
      memo: student.memo ?? "",
      active: !!student.active
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const token = localStorage.getItem("token");
    await axios.put(`${API_URL}/api/users/${editingId}`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    resetForm();
    fetchStudents();
  };

  const handleDelete = async (student) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/api/users/${student._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchStudents();
  };

  return (
    <div style={{ padding: 16 }}>
      {/* 헤더 */}
      <div style={styles.cardHeader}>
        <div style={styles.headerDot} />
        <div>
          <h2 style={styles.h2}>학생 관리</h2>
          <div style={styles.subtle}>학생 등록/수정/삭제와 진행 이력/캘린더 확인</div>
        </div>
      </div>

      {/* 검색/필터 */}
      <div style={styles.toolbar}>
        <input
          placeholder="검색(이름/전화)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={styles.input}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          비활성 포함
        </label>
      </div>

      {/* 입력 + 목록 2단 카드 */}
      <div style={styles.cols}>
        {/* 입력 카드 */}
        <div style={styles.card}>
          <SectionTitle title="학생 추가 / 수정" />
          <div style={styles.formGrid}>
            <input name="name" placeholder="이름" value={form.name} onChange={handleChange} style={styles.input} />
            <input name="phone" placeholder="전화번호" value={form.phone} onChange={handleChange} style={styles.input} />
            <input name="grade" placeholder="학년" value={form.grade} onChange={handleChange} style={styles.input} />
            <select name="schoolId" value={form.schoolId} onChange={handleChange} style={styles.input}>
              <option value="">학교 선택</option>
              {schools.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <input name="parentName" placeholder="학부모 성함" value={form.parentName} onChange={handleChange} style={styles.input} />
            <input name="parentPhone" placeholder="학부모 연락처" value={form.parentPhone} onChange={handleChange} style={styles.input} />
            <input name="memo" placeholder="메모" value={form.memo} onChange={handleChange} style={{ ...styles.input, gridColumn: "span 2" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> 활성
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {editingId ? (
              <>
                <button onClick={handleUpdate} style={styles.btnPrimary}>저장</button>
                <button onClick={resetForm} style={styles.btnGhost}>취소</button>
              </>
            ) : (
              <button onClick={handleAdd} style={styles.btnSuccess}>추가</button>
            )}
          </div>
        </div>

        {/* 목록 카드 */}
        <div style={styles.card}>
          <SectionTitle title={`학생 목록 (${students.length})`} />
          <div style={{ border: "1px solid #eef2fb", borderRadius: 12, overflow: "hidden" }}>
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafd" }}>
                  <Th>이름</Th>
                  <Th>전화</Th>
                  <Th>학년</Th>
                  <Th>학교</Th>
                  <Th>학부모</Th>
                  <Th>메모</Th>
                  <Th>상태</Th>
                  <Th>관리</Th>
                </tr>
              </thead>
              <tbody>
                {students.map((u) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid #f4f6fd" }}>
                    <Td>
                      <button onClick={() => setDetailTarget(u)} style={styles.linkButton}>
                        {u.name}
                      </button>
                    </Td>
                    <Td>{u.phone}</Td>
                    <Td>{u.grade}</Td>
                    <Td>{u.school?.name || u.schoolName || "-"}</Td>
                    <Td>{u.parentName} {u.parentPhone ? `(${u.parentPhone})` : ""}</Td>
                    <Td>{u.memo}</Td>
                    <Td>{u.active ? "활성" : "비활성"}</Td>
                    <Td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => handleEdit(u)} style={styles.btnLight}>수정</button>
                        <button
                          onClick={() => { if (window.confirm("정말 삭제하시겠습니까?")) handleDelete(u); }}
                          style={styles.btnDanger}
                        >
                          삭제
                        </button>
                        <button onClick={() => setHistoryUserId(u._id)} style={styles.btnLight}>이력</button>
                        <button onClick={() => setCalendarStudent(u)} style={styles.btnLight} title="학생의 온라인 진도를 달력으로 보기">📅 캘린더</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 모달들 (기존 로직 동일) */}
      {detailTarget && (
        <StudentDetailModal student={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
      {historyUserId && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <StudentProgressHistory userId={historyUserId} onClose={() => setHistoryUserId(null)} />
          </div>
        </div>
      )}
      {calendarStudent && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCardWide}>
            <div style={styles.modalHeader}>{calendarStudent.name}님의 진도 캘린더 (인강 + 현강)</div>
            <div style={{
              padding: 16,
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{
                marginBottom: 16,
                padding: 12,
                background: '#f8fafc',
                borderRadius: 8,
                fontSize: 14,
                color: '#64748b',
                flexShrink: 0
              }}>
                📅 <strong>캘린더 기능 안내:</strong><br/>
                • <span style={{ color: "#1d4ed8", fontWeight: 'bold' }}>인강</span>: 학생이 온라인으로 완료한 강의/단원<br/>
                • <span style={{ color: "#059669", fontWeight: 'bold' }}>현강</span>: 현장 수업 기록<br/>
                • 달력의 항목을 클릭해도 수정은 되지 않으며, 진도는 학생이 직접 "내 강의"에서 저장합니다
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <StudentCalendarView userId={calendarStudent._id} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setCalendarStudent(null)} style={styles.btnGhost}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── presentational helpers ───────────────────────── */
function SectionTitle({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 6, height: 18, borderRadius: 4, background: "#1677ff" }} />
      <div style={{ fontWeight: 700, color: "#0f172a" }}>{title}</div>
    </div>
  );
}
function Th({ children }) {
  return <th style={{ padding: 10, borderBottom: "1px solid #eff3fa", textAlign: "left", color: "#475569", fontWeight: 700 }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: 10, color: "#0f172a", verticalAlign: "top" }}>{children}</td>;
}

const styles = {
  h2: { margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 800 },
  subtle: { color: "#64748b", fontSize: 13 },
  cardHeader: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 16px", marginBottom: 14,
    border: "1px solid #e7e9ef", borderRadius: 14,
    background: "linear-gradient(180deg, #f7faff 0%, #ffffff 100%)"
  },
  headerDot: {
    width: 10, height: 10, borderRadius: 9999,
    background: "#1677ff", boxShadow: "0 0 0 4px rgba(22,119,255,.12)"
  },
  toolbar: {
    display: "flex", alignItems: "center", gap: 12,
    marginBottom: 14
  },
  cols: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 430px) 1fr",
    gap: 16
  },
  card: {
    border: "1px solid #e8edf7", background: "#fff",
    borderRadius: 14, padding: 14
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10
  },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cfd8ea",
    outline: "none",
    background: "#fff"
  },
  linkButton: {
    padding: 0, background: "transparent", border: 0, cursor: "pointer", color: "#1677ff"
  },
  btnPrimary: { padding: "10px 14px", background: "#1677ff", color: "#fff", fontWeight: 700, border: 0, borderRadius: 10, cursor: "pointer" },
  btnSuccess: { padding: "10px 14px", background: "#52c41a", color: "#fff", fontWeight: 700, border: 0, borderRadius: 10, cursor: "pointer" },
  btnLight: { padding: "8px 10px", background: "#fff", color: "#0f172a", border: "1px solid #cfd8ea", borderRadius: 10, cursor: "pointer" },
  btnDanger: { padding: "8px 10px", background: "#fff1f0", color: "#cf1322", border: "1px solid #ffccc7", borderRadius: 10, cursor: "pointer" },
  btnGhost: { padding: "8px 12px", background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modalCard: { width: 640, maxWidth: "92%", background: "#fff", borderRadius: 12, border: "1px solid #e8edf7", boxShadow: "0 10px 26px rgba(28,39,60,.18)" },
  modalCardWide: { width: 900, maxWidth: "98%", maxHeight: "90vh", background: "#fff", borderRadius: 12, border: "1px solid #e8edf7", boxShadow: "0 10px 26px rgba(28,39,60,.18)", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "12px 14px", borderBottom: "1px solid #eef2fb", fontWeight: 700 },
  modalFooter: { padding: "10px 14px", borderTop: "1px solid #eef2fb", textAlign: "right", flexShrink: 0 }
};

export default StudentManager;
