// /client/src/pages/AttendancePage.js
import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../api";
import PhoneInputWithKeypad from "../components/PhoneInputWithKeypad";

// 짧은 비프음 Base64 오디오
const BEEP_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAAgD///w==";
const beep = () => {
  const audio = new window.Audio(BEEP_SRC);
  audio.play();
};

function AttendancePage() {
  const [tail, setTail] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) 핸드폰 뒷자리 → 학생찾기
  const handleFind = async () => {
    setMsg("");
    setSelectedId("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/attendance/find-students`, { phoneTail: tail });
      setStudents(data);
      setStep(2);
    } catch (e) {
      setMsg(e.response?.data?.message || "학생 없음");
      setStep(1);
    }
    setLoading(false);
  };

  // 2) 학생선택 → 등/하원 자동 처리
  const handleEntry = async () => {
    if (!selectedId || loading) return;
    setMsg("");
    setLoading(true);
    beep(); // 비프음
    try {
      const { data } = await axios.post(`${API_URL}/api/attendance/entry`, { userId: selectedId });
      setMsg(data.message);
      setTimeout(() => {
        setStep(1);
        setStudents([]);
        setSelectedId("");
        setTail("");
        setMsg("");
      }, 2500);
    } catch (e) {
      setMsg(e.response?.data?.message || "처리실패");
    }
    setLoading(false);
  };

  // 학생 선택 시 비프음
  const handleSelectStudent = (id) => {
    beep();
    setSelectedId(id);
  };

  // 등하원페이지만 보이게(풀스크린) - 전체 body 백그라운드 제거 등 스타일
  React.useEffect(() => {
    const original = document.body.style.background;
    document.body.style.background = "#f7faff";
    return () => { document.body.style.background = original; }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7faff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        margin: "auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 24px #0001",
        padding: 32,
        minHeight: 480,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: 28, fontWeight: 800, fontSize: 26, letterSpacing: 1 }}>등하원 출결</h2>

        {step === 1 && (
          <>
            <PhoneInputWithKeypad
              value={tail}
              onChange={v => setTail(v.replace(/[^0-9]/g, "").slice(0, 4))}
              onEnter={handleFind}
              disabled={loading}
            />
            <button
              onClick={handleFind}
              disabled={tail.length !== 4 || loading}
              style={{
                width: "100%", padding: 14,
                background: tail.length === 4 && !loading ? "#226ad6" : "#eee",
                color: tail.length === 4 && !loading ? "#fff" : "#999",
                border: "none", borderRadius: 10,
                fontWeight: 700, marginTop: 13,
                fontSize: 18, letterSpacing: 1,
                cursor: tail.length === 4 && !loading ? "pointer" : "not-allowed",
                transition: "background .13s"
              }}>
              {loading ? "조회 중..." : "학생찾기"}
            </button>
          </>
        )}

        {step === 2 && students.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 13 }}>누구인가요?</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {students.map(s =>
                <li key={s._id} style={{ marginBottom: 9 }}>
                  <button
                    onClick={() => handleSelectStudent(s._id)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: 13,
                      borderRadius: 12,
                      background: selectedId === s._id ? "#226ad6" : "#eee",
                      color: selectedId === s._id ? "#fff" : "#222",
                      fontWeight: 700,
                      fontSize: 19,
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: selectedId === s._id ? "0 1px 7px #226ad631" : "0 1px 2px #0001",
                      transition: "background .13s"
                    }}>
                    {s.name}
                  </button>
                </li>
              )}
            </ul>
            {selectedId && (
              <button
                onClick={handleEntry}
                disabled={loading}
                style={{
                  width: "100%", padding: 15,
                  background: "#3cbb2c",
                  color: "#fff",
                  border: "none", borderRadius: 10,
                  fontWeight: 800, marginTop: 14,
                  fontSize: 20,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 1.5px 5px #3cbb2c22",
                  opacity: loading ? 0.7 : 1,
                  transition: "background .13s"
                }}>
                {loading ? "처리 중..." : (students.length === 1 ? "확인" : "이 학생 맞아요!")}
              </button>
            )}
            <button
              onClick={() => { setStep(1); setStudents([]); setSelectedId(""); setTail(""); setMsg(""); }}
              disabled={loading}
              style={{
                width: "100%", padding: 10,
                background: "#eee",
                marginTop: 13,
                borderRadius: 8, border: "none",
                fontWeight: 600, color: "#444",
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer"
              }}>처음으로</button>
          </div>
        )}
        {msg && (
          <div style={{
            color: "#227a22", marginTop: 19,
            textAlign: "center", fontWeight: 700,
            fontSize: 17
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;