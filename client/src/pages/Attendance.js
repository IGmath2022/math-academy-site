import React, { useState } from "react";
import axios from "axios";

function Attendance() {
  const [phoneLast4, setPhoneLast4] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("등원");
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult("");
    try {
      const res = await axios.post("/api/attendance", {
        phoneLast4,
        name,
        type
      });
      setResult("출결 등록 및 알림톡 발송 완료!");
    } catch (e) {
      setResult(e.response?.data?.message || "등록 실패");
    }
  };

  return (
    <div style={{ maxWidth: 340, margin: "60px auto", padding: 20, background: "#fff", borderRadius: 16 }}>
      <h2>IG수학 출결 등록</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="학생 이름"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10, fontSize: 16 }}
        />
        <input
          type="text"
          placeholder="휴대폰 뒷자리"
          value={phoneLast4}
          onChange={e => setPhoneLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
          required
          style={{ width: "100%", marginBottom: 10, fontSize: 16 }}
        />
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", marginBottom: 10 }}>
          <option value="등원">등원</option>
          <option value="하원">하원</option>
        </select>
        <button style={{ width: "100%", padding: 12, background: "#226ad6", color: "#fff", fontWeight: "bold", border: "none", borderRadius: 8 }}>등록</button>
      </form>
      {result && <div style={{ marginTop: 16, color: "#227a22", fontWeight: 600 }}>{result}</div>}
    </div>
  );
}

export default Attendance;