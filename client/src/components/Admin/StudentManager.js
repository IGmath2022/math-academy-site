import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_URL } from '../../api';

// 진도/메모 기록
function StudentProgressHistory({ userId, chapters }) {
  const [progress, setProgress] = useState([]);
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    axios.get(`${API_URL}/api/progress?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setProgress(r.data));
  }, [userId]);

  const getChapterName = id => chapters.find(c => c._id === id)?.name || id;

  return (
    <div style={{ marginTop: 22, padding: "10px 0 0", borderTop: "1px solid #eee" }}>
      <h4 style={{ margin: "0 0 7px 0", fontSize: 15, color: "#346" }}>진도/메모 기록</h4>
      {progress.length === 0 ? (
        <div style={{ color: "#999", fontSize: 13 }}>기록 없음</div>
      ) : (
        <ul style={{ fontSize: 15, padding: 0, margin: 0 }}>
          {progress.map(p => (
            <li key={p._id} style={{ marginBottom: 7, lineHeight: 1.6 }}>
              <span style={{ color: "#226ad6" }}>{p.date}</span>
              &nbsp;|&nbsp;<b>{getChapterName(p.chapterId)}</b>
              {p.memo && <> &nbsp;- <span style={{ color: "#444" }}>{p.memo}</span></>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 진도 달력
function StudentProgressCalendar({ userId, chapters }) {
  const [progress, setProgress] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    axios.get(`${API_URL}/api/progress?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setProgress(r.data));
  }, [userId]);

  const progressMap = {};
  progress.forEach(p => {
    progressMap[p.date] = progressMap[p.date] || [];
    progressMap[p.date].push(p);
  });

  function dateToYMD(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
  }

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const ymd = dateToYMD(date);
    return progressMap[ymd] ? (
      <div style={{
        background: "#226ad6", color: "#fff", borderRadius: "50%",
        width: 22, height: 22, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
      }}>
        ✔
      </div>
    ) : null;
  };

  const onDateClick = d => {
    const ymd = dateToYMD(d);
    setSelectedDate(progressMap[ymd] ? ymd : null);
  };

  return (
    <div style={{ margin: "28px 0 0 0", borderTop: "1px solid #eee", paddingTop: 14 }}>
      <h4 style={{ fontSize: 15, color: "#246", margin: 0, marginBottom: 10 }}>진도 달력</h4>
      <Calendar onClickDay={onDateClick} tileContent={tileContent} locale="ko" />
      {selectedDate && (
        <div style={{ marginTop: 12, fontSize: 14, background: "#f8fafb", borderRadius: 7, padding: 9 }}>
          <b>{selectedDate}</b>
          <ul style={{ margin: 6, padding: 0 }}>
            {progressMap[selectedDate].map(p => (
              <li key={p._id}>
                <b>{chapters.find(c => c._id === p.chapterId)?.name || p.chapterId}</b>
                {p.memo && <> - <span style={{ color: "#457" }}>{p.memo}</span></>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 학생 상세/수정 모달
function StudentDetailModal({ student, onClose, onUpdate, schools, chapters }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: student?.name || "",
    schoolId: student?.schoolId || "",
    email: student?.email || "",
  });

  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    setForm({
      name: student?.name || "",
      schoolId: student?.schoolId || "",
      email: student?.email || "",
    });
  }, [student]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // schoolId → String으로 맞춰 비교
  const getSchoolName = id => {
    if (!id) return "-";
    return schools.find(s => String(s._id) === String(id))?.name || "-";
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    await axios.put(`${API_URL}/api/users/${student._id}`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    onUpdate();
    setEdit(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/api/users/${student._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    onUpdate();
    onClose();
  };

  const handleActiveToggle = async () => {
    const token = localStorage.getItem("token");
    await axios.patch(`${API_URL}/api/users/${student._id}/active`, {
      active: !student.active
    }, { headers: { Authorization: `Bearer ${token}` } });
    onUpdate();
    onClose();
  };

  if (!student) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,.23)", zIndex: 2100,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, boxShadow: "0 2px 18px #0002",
        padding: 32, minWidth: 300, maxWidth: 430, position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 13, right: 14, border: "none",
          background: "none", fontSize: 23, fontWeight: 800, color: "#456", cursor: "pointer"
        }}>×</button>

        <h3 style={{ marginTop: 0, marginBottom: 19 }}>
          {student.name} 상세 정보
          <span style={{
            marginLeft: 10, fontSize: 13, padding: "2px 8px",
            borderRadius: 8,
            background: student.active ? "#e3faea" : "#f9e1e1",
            color: student.active ? "#218a43" : "#d33"
          }}>
            {student.active ? "활성" : "비활성"}
          </span>
        </h3>

        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowCalendar(false)} style={{
            marginRight: 7, background: showCalendar ? "#e4e9f2" : "#226ad6",
            color: showCalendar ? "#333" : "#fff", border: "none", borderRadius: 7, padding: "6px 12px"
          }}>
            상세 정보
          </button>
          <button onClick={() => setShowCalendar(true)} style={{
            background: showCalendar ? "#226ad6" : "#e4e9f2",
            color: showCalendar ? "#fff" : "#333", border: "none", borderRadius: 7, padding: "6px 12px"
          }}>
            진도 달력
          </button>
        </div>

        {!showCalendar ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <b>이름:</b> {edit
                ? <input name="name" value={form.name} onChange={handleChange} style={{ marginLeft: 7, padding: "4px 6px", borderRadius: 7 }} />
                : student.name}
            </div>
            <div style={{ marginBottom: 10 }}>
              <b>이메일:</b> {edit
                ? <input name="email" value={form.email} onChange={handleChange} style={{ marginLeft: 7, padding: "4px 6px", borderRadius: 7 }} />
                : student.email}
            </div>
            <div style={{ marginBottom: 10 }}>
              <b>학교:</b> {edit
                ? (
                  <select
                    name="schoolId"
                    value={String(form.schoolId)}
                    onChange={handleChange}
                    style={{ marginLeft: 7, padding: "4px 6px", borderRadius: 7 }}
                  >
                    <option value="">학교 선택</option>
                    {schools.map(s => (
                      <option value={String(s._id)} key={s._id}>{s.name}</option>
                    ))}
                  </select>
                )
                : getSchoolName(student.schoolId)}
            </div>
            <div style={{ marginTop: 18, textAlign: "right" }}>
              {!edit ? (
                <button onClick={() => setEdit(true)} style={{ padding: "7px 18px", borderRadius: 7, background: "#226ad6", color: "#fff", border: "none" }}>수정</button>
              ) : (
                <>
                  <button onClick={handleSave} style={{ padding: "7px 18px", borderRadius: 7, background: "#226ad6", color: "#fff", border: "none", marginRight: 8 }}>저장</button>
                  <button onClick={() => setEdit(false)} style={{ padding: "7px 12px", borderRadius: 7, background: "#e3e5ec", border: "none" }}>취소</button>
                </>
              )}
              {!edit && (
                <>
                  <button onClick={handleDelete} style={{ padding: "7px 12px", borderRadius: 7, background: "#f66", color: "#fff", border: "none", marginLeft: 10 }}>
                    학생 삭제
                  </button>
                  <button onClick={handleActiveToggle} style={{
                    padding: "7px 12px", borderRadius: 7,
                    background: student.active ? "#bbb" : "#226ad6",
                    color: "#fff", border: "none", marginLeft: 8, fontWeight: 600
                  }}>
                    {student.active ? "비활성화" : "활성화"}
                  </button>
                </>
              )}
            </div>
            <StudentProgressHistory userId={student._id} chapters={chapters} />
          </>
        ) : (
          <StudentProgressCalendar userId={student._id} chapters={chapters} />
        )}
      </div>
    </div>
  );
}

// 학생 전체 관리 메인
function StudentManager() {
  const [students, setStudents] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState(null);
  const [schools, setSchools] = useState([]);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API_URL}/api/users?role=student${showInactive ? "&active=false" : ""}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      // schoolId Object → String 강제 변환
      const data = res.data.map(student => ({
        ...student,
        schoolId:
          student.schoolId && typeof student.schoolId === "object"
            ? (student.schoolId.toHexString
                ? student.schoolId.toHexString()
                : (student.schoolId.$oid || student.schoolId.toString && student.schoolId.toString() || ""))
            : student.schoolId
      }));
      setStudents(data);
    });

    axios.get(`${API_URL}/api/schools`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSchools(res.data));

    axios.get(`${API_URL}/api/chapters`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setChapters(res.data));
  }, [showInactive]);

  // schoolId → String 맞춰 비교
  const getSchoolName = id => {
    if (!id) return "-";
    return schools.find(s => String(s._id) === String(id))?.name || "-";
  };

  return (
    <div style={{
      border: "1px solid #e5e8ec", background: "#f9fafb",
      borderRadius: 13, padding: "20px 12px", marginBottom: 30,
      boxShadow: "0 2px 8px #0001", maxWidth: 600, margin: "0 auto 18px"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 19 }}>학생 관리</h3>
      <button onClick={() => setShowInactive(x => !x)} style={{
        marginBottom: 10, borderRadius: 7, padding: "7px 18px",
        background: showInactive ? "#bbb" : "#226ad6", color: "#fff", border: "none", fontWeight: 600
      }}>
        {showInactive ? "활성 학생 보기" : "비활성 학생 보기"}
      </button>
      <ul style={{ padding: 0, margin: 0 }}>
        {students.map(s => (
          <li key={s._id} style={{
            display: "flex", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #eee",
            opacity: s.active ? 1 : 0.6
          }}>
            <span onClick={() => setSelected(s)} style={{
              flex: 1, cursor: "pointer",
              color: s.active ? "#226ad6" : "#aaa",
              fontWeight: s.active ? 600 : 400
            }}>{s.name}</span>
            <span style={{ color: "#888", fontSize: 13 }}>{s.email}</span>
            <span style={{ color: "#999", fontSize: 13, marginLeft: 7 }}>{getSchoolName(s.schoolId)}</span>
            <span style={{
              fontSize: 12, marginLeft: 10,
              background: s.active ? "#e3faea" : "#f9e1e1",
              color: s.active ? "#218a43" : "#d33",
              borderRadius: 8, padding: "2px 8px"
            }}>
              {s.active ? "활성" : "비활성"}
            </span>
          </li>
        ))}
      </ul>
      {selected && (
        <StudentDetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            const token = localStorage.getItem("token");
            axios.get(`${API_URL}/api/users?role=student${showInactive ? "&active=false" : ""}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
              const data = res.data.map(student => ({
                ...student,
                schoolId:
                  student.schoolId && typeof student.schoolId === "object"
                    ? (student.schoolId.toHexString
                        ? student.schoolId.toHexString()
                        : (student.schoolId.$oid || student.schoolId.toString && student.schoolId.toString() || ""))
                    : student.schoolId
              }));
              setStudents(data);
            });
          }}
          schools={schools}
          chapters={chapters}
        />
      )}
    </div>
  );
}

export default StudentManager;