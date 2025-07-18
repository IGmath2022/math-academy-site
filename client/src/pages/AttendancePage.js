// /client/src/pages/AttendancePage.js
import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../api";
import PhoneInputWithKeypad from "../components/PhoneInputWithKeypad";

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

  const handleEntry = async () => {
    setMsg("");
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
      const errorMsg = e.response?.data?.message || "처리실패";
      setMsg(errorMsg);
      // 409 에러(이미 등/하원 완료)거나 메시지에 "완료" 포함시 리셋
      if (e.response?.status === 409 || errorMsg.includes("완료")) {
        setTimeout(() => {
          setStep(1);
          setStudents([]);
          setSelectedId("");
          setTail("");
          setMsg("");
        }, 2500);
      }
    }
  };

  const handleSelectStudent = (id) => {
    beep();
    setSelectedId(id);
  };

  React.useEffect(() => {
    document.body.style.background = "#f7faff";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.background = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw", height: "100vh", minHeight: "100dvh",
        padding: 0, margin: 0, boxSizing: "border-box",
        background: "#f7faff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          width: "100vw", maxWidth: "100vw", height: "100vh",
          minHeight: "100dvh",
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          padding: 0, margin: 0
        }}
      >
        <h2
          style={{
            textAlign: "center", margin: "0 0 20px 0",
            fontWeight: 900, fontSize: "2.7rem", letterSpacing: 2,
            color: "#193066", textShadow: "0 3px 12px #0002"
          }}
        >
          등하원 출결
        </h2>
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
                width: "98vw", maxWidth: 500,
                padding: "27px 0", margin: "26px 0 0 0",
                background: tail.length === 4 && !loading ? "#226ad6" : "#e0e3ee",
                color: tail.length === 4 && !loading ? "#fff" : "#999",
                border: "none", borderRadius: 18,
                fontWeight: 900, fontSize: "2.2rem", letterSpacing: 3,
                boxShadow: tail.length === 4 ? "0 1.5px 12px #226ad630" : "none",
                cursor: tail.length === 4 && !loading ? "pointer" : "not-allowed",
                transition: "background .13s"
              }}
            >
              {loading ? "조회 중..." : "학생찾기"}
            </button>
          </>
        )}

        {step === 2 && students.length > 0 && (
          <div
            style={{
              width: "100vw", maxWidth: "100vw", marginTop: 10,
              display: "flex", flexDirection: "column", alignItems: "center"
            }}
          >
            <div style={{ fontWeight: 900, fontSize: "2rem", marginBottom: 22, color: "#222" }}>
              누구인가요?
            </div>
            <ul
              style={{
                listStyle: "none", padding: 0, margin: 0, width: "100vw",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 18
              }}
            >
              {students.map(s =>
                <li key={s._id} style={{ width: "98vw", maxWidth: 500 }}>
                  <button
                    onClick={() => handleSelectStudent(s._id)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "27px 0",
                      borderRadius: 18,
                      background: selectedId === s._id ? "#226ad6" : "#e0e3ee",
                      color: selectedId === s._id ? "#fff" : "#222",
                      fontWeight: 900,
                      fontSize: "2.1rem",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: selectedId === s._id ? "0 1px 10px #226ad631" : "none",
                      transition: "background .13s"
                    }}
                  >
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
                  width: "98vw", maxWidth: 500,
                  padding: "27px 0",
                  background: "#3cbb2c",
                  color: "#fff",
                  border: "none", borderRadius: 18,
                  fontWeight: 900, marginTop: 18,
                  fontSize: "2.2rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 12px #3cbb2c22",
                  opacity: loading ? 0.65 : 1,
                  transition: "background .13s"
                }}
              >
                {loading ? "처리 중..." : (students.length === 1 ? "확인" : "이 학생 맞아요!")}
              </button>
            )}
            <button
              onClick={() => { setStep(1); setStudents([]); setSelectedId(""); setTail(""); setMsg(""); }}
              disabled={loading}
              style={{
                width: "98vw", maxWidth: 500, padding: "17px 0",
                background: "#eee", marginTop: 18,
                borderRadius: 16, border: "none",
                fontWeight: 800, color: "#444", fontSize: "1.7rem",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
              처음으로
            </button>
          </div>
        )}
        {msg && (
          <div style={{
            color: "#227a22", marginTop: 34, marginBottom: 4,
            textAlign: "center", fontWeight: 900,
            fontSize: "1.85rem"
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;