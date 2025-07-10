import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from '../api';

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentPhone, setParentPhone] = useState(""); // ★
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/api/schools`).then(res => setSchools(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        parentPhone: parentPhone.trim(), // ★
        schoolId: schoolId.trim()
      });
      alert("회원가입 성공! 로그인 해주세요.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "회원가입 실패");
    }
  };

  // id와 _id 모두 지원
  const getId = (school) => school.id || school._id;

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
        minHeight: 430
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 32 }}>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="학부모 휴대폰번호 (예: 01012345678)"
          value={parentPhone}
          onChange={e => setParentPhone(e.target.value)}
          required
        />
        {/* 학교 선택 드롭다운 */}
        <select value={schoolId} onChange={e => setSchoolId(e.target.value)} required>
          <option value="">학교 선택</option>
          {schools.map(s => (
            <option key={getId(s)} value={getId(s)}>{s.name}</option>
          ))}
        </select>
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
          회원가입
        </button>
      </form>
      {error && (
        <p style={{ color: "#e14", textAlign: "center", margin: "16px 0 0" }}>{error}</p>
      )}
      <p style={{ marginTop: 18, textAlign: "center", fontSize: 15 }}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}

export default Register;