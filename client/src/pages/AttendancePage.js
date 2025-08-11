import React, { useState, useEffect } from "react";
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

  const handleCheck = async (type) => {
    if (!window.confirm(`${type === 'IN' ? '등원' : '하원'} 처리하시겠습니까?`)) return;
    setMsg("");
    try {
      const { data } = await axios.post(`${API_URL}/api/attendance/check-${type === 'IN' ? 'in' : 'out'}`, { userId: selectedId });
      setMsg(data.message);
      resetAfterDelay();
    } catch (e) {
      const errorMsg = e.response?.data?.message || "처리실패";
      setMsg(errorMsg);
      if (e.response?.status === 409 || errorMsg.includes("완료")) {
        resetAfterDelay();
      }
    }
  };

  const resetAfterDelay = () => {
    setTimeout(() => {
      setStep(1);
      setStudents([]);
      setSelectedId("");
      setTail("");
      setMsg("");
    }, 2500);
  };

  const handleSelectStudent = (id) => {
    beep();
    setSelectedId(id);
  };

  useEffect(() => {
    document.body.style.background = "#f7faff";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.background = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", minHeight: "100dvh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#f7faff"
    }}>
      <h2 style={{
        textAlign: "center", marginBottom: 20,
        fontWeight: 900, fontSize: "2.7rem", color: "#193066",
        textShadow: "0 3px 12px #0002"
      }}>등하원 출결</h2>

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
              padding: "27px 0", marginTop: 26,
              background: tail.length === 4 && !loading ? "#226ad6" : "#e0e3ee",
              color: tail.length === 4 && !loading ? "#fff" : "#999",
              border: "none", borderRadius: 18,
              fontWeight: 900, fontSize: "2.2rem", letterSpacing: 3
            }}
          >
            {loading ? "조회 중..." : "학생찾기"}
          </button>
        </>
      )}

      {step === 2 && students.length > 0 && (
        <div style={{ width: "100vw", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: "2rem", marginBottom: 22 }}>누구인가요?</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            {students.map(s =>
              <li key={s._id} style={{ width: "98vw", maxWidth: 500 }}>
                <button
                  onClick={() => handleSelectStudent(s._id)}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "27px 0", borderRadius: 18,
                    background: selectedId === s._id ? "#226ad6" : "#e0e3ee",
                    color: selectedId === s._id ? "#fff" : "#222",
                    fontWeight: 900, fontSize: "2.1rem",
                    border: "none"
                  }}
                >
                  {s.name}
                </button>
              </li>
            )}
          </ul>

          {selectedId && (
            <div style={{ display: "flex", gap: 16, marginTop: 18, width: "98vw", maxWidth: 500 }}>
              <button
                onClick={() => handleCheck('IN')}
                disabled={loading}
                style={{
                  flex: 1, padding: "27px 0", background: "#3cbb2c",
                  color: "#fff", border: "none", borderRadius: 18,
                  fontWeight: 900, fontSize: "2.2rem"
                }}
              >
                등원
              </button>
              <button
                onClick={() => handleCheck('OUT')}
                disabled={loading}
                style={{
                  flex: 1, padding: "27px 0", background: "#d62828",
                  color: "#fff", border: "none", borderRadius: 18,
                  fontWeight: 900, fontSize: "2.2rem"
                }}
              >
                하원
              </button>
            </div>
          )}

          <button
            onClick={() => { setStep(1); setStudents([]); setSelectedId(""); setTail(""); setMsg(""); }}
            disabled={loading}
            style={{
              width: "98vw", maxWidth: 500, padding: "17px 0",
              background: "#eee", marginTop: 18,
              borderRadius: 16, border: "none",
              fontWeight: 800, color: "#444", fontSize: "1.7rem"
            }}
          >
            처음으로
          </button>
        </div>
      )}

      {msg && (
        <div style={{ color: "#227a22", marginTop: 34, fontWeight: 900, fontSize: "1.85rem", textAlign: "center" }}>
          {msg}
        </div>
      )}
    </div>
  );
}

export default AttendancePage;