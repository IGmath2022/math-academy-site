import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from '../api';

console.log("로그인 컴포넌트에서 API_URL:", API_URL);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "로그인 실패");
    }
  };

  return (
    <div
      className="container"
      style={{
        maxWidth: 360,
        margin: "48px auto",
        padding: "40px 6vw",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 18px #0001",
        minHeight: 340
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 32 }}>로그인</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 16,
            fontSize: 16,
            padding: "14px 10px",
            borderRadius: 9,
            border: "1px solid #eee",
            background: "#fafbfc",
            boxSizing: "border-box"
          }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 18,
            fontSize: 16,
            padding: "14px 10px",
            borderRadius: 9,
            border: "1px solid #eee",
            background: "#fafbfc",
            boxSizing: "border-box"
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 15,
            fontSize: 17,
            fontWeight: "bold",
            borderRadius: 9,
            border: "none",
            background: "#2d4373",
            color: "#fff",
            cursor: "pointer",
            marginBottom: 8
          }}
        >
          로그인
        </button>
      </form>
      {error && (
        <p style={{ color: "#e14", textAlign: "center", margin: "16px 0 0" }}>{error}</p>
      )}
      <p style={{ marginTop: 18, textAlign: "center", fontSize: 15 }}>
        아직 회원이 아니신가요? <Link to="/register">회원가입</Link>
      </p>
    </div>
  );
}

export default Login;