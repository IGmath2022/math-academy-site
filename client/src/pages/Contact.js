import React, { useState } from "react";
import axios from "axios";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    date: "",
    message: "",
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      await axios.post("/api/contact", form);
      setResult("신청이 완료되었습니다! 빠른 상담 드릴게요.");
      setForm({ name: "", contact: "", date: "", message: "" });
    } catch {
      setResult("오류가 발생했습니다. 다시 시도해 주세요.");
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{
      maxWidth: 440, margin: "40px auto", padding: "4vw 2vw",
      background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px #0001"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>IG수학 상담 문의</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="이름"
          required
          style={{ padding: "12px 10px", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="연락처(휴대폰/이메일)"
          required
          style={{ padding: "12px 10px", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <input
          name="date"
          value={form.date}
          onChange={handleChange}
          placeholder="상담 희망 날짜(예: 2025-07-02)"
          required
          style={{ padding: "12px 10px", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="문의사항 (필수)"
          required
          rows={3}
          style={{ padding: "12px 10px", borderRadius: 8, border: "1px solid #ccc", resize: "vertical" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "13px 0", borderRadius: 8, fontWeight: "bold", fontSize: 17,
            background: "#226ad6", color: "#fff", border: "none", marginTop: 5
          }}
        >
          {loading ? "신청 중..." : "상담 신청"}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 15, color: result.startsWith("오류") ? "#c22" : "#227a22", textAlign: "center" }}>
          {result}
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 26 }}>
        <a
          href="https://pf.kakao.com/_dSHvxj" // ← IG수학 카카오톡채널 링크!
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block", background: "#FEE500", color: "#181600",
            fontWeight: "bold", padding: "10px 28px", borderRadius: 22,
            textDecoration: "none", marginTop: 6, boxShadow: "0 2px 8px #0002"
          }}
        >
          카카오톡 1:1 문의 바로가기
        </a>
      </div>
    </div>
  );
}
export default Contact;