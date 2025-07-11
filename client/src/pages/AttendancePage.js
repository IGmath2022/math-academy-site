import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../api";

function AttendancePage() {
  const [tail, setTail] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");

  // 1) 핸드폰 뒷자리 → 학생찾기
  const handleFind = async () => {
    setMsg("");
    setSelectedId("");
    try {
      const { data } = await axios.post(`${API_URL}/api/attendance/find-students`, { phoneTail: tail });
      setStudents(data);
      setStep(2);
    } catch (e) {
      setMsg(e.response?.data?.message || "학생 없음");
      setStep(1);
    }
  };

  // 2) 학생선택 → 등/하원 자동 처리
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
      setMsg(e.response?.data?.message || "처리실패");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", background: "#fff", borderRadius: 14, boxShadow: "0 2px 16px #0001", padding: 26 }}>
      <h2 style={{ textAlign: "center" }}>등하원 출결</h2>
      {step === 1 && (
        <>
          <input placeholder="학부모 핸드폰 뒷4자리"
            value={tail}
            onChange={e => setTail(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={4}
            style={{ width: "90%", fontSize: 18, padding: 10, borderRadius: 8, border: "1px solid #eee", marginBottom: 16 }}
          />
          <button onClick={handleFind} style={{ width: "100%", padding: 13, background: "#226ad6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}>
            학생찾기
          </button>
        </>
      )}
      {step === 2 && students.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div>누구인가요?</div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {students.map(s =>
              <li key={s._id}>
                <button onClick={() => setSelectedId(s._id)}
                  style={{ width: "100%", padding: 13, margin: "7px 0", borderRadius: 7, background: selectedId === s._id ? "#226ad6" : "#eee", color: selectedId === s._id ? "#fff" : "#333", fontWeight: 600 }}>
                  {s.name}
                </button>
              </li>
            )}
          </ul>
          {selectedId && (
            <button onClick={handleEntry} style={{ width: "100%", padding: 14, background: "#3cbb2c", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, marginTop: 10 }}>
              {students.length === 1 ? "확인" : "이 학생 맞아요!"}
            </button>
          )}
          <button onClick={() => { setStep(1); setStudents([]); setSelectedId(""); setTail(""); }} style={{ width: "100%", padding: 10, background: "#eee", marginTop: 15, borderRadius: 7, border: "none" }}>처음으로</button>
        </div>
      )}
      {msg && <div style={{ color: "#227a22", marginTop: 17, textAlign: "center", fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

export default AttendancePage;