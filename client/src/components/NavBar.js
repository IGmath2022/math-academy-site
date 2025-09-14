import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}
function isExpired(token) {
  const { exp } = parseJwt(token);
  if (!exp) return true;               // exp 없으면 만료로 취급
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec;
}

function NavBar() {
  // 초기엔 "로그아웃 상태"로 시작 -> 검증 통과 시에만 로그인 UI 노출
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const checkingRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  // 공통 정리 함수
  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
  };

  // 토큰/역할 검증
  const verifyAuth = async () => {
    if (checkingRef.current) return; // 중복 호출 방지
    checkingRef.current = true;
    setChecking(true);

    try {
      const token = localStorage.getItem("token");
      const savedRole = localStorage.getItem("role");

      if (!token || !savedRole) {
        clearAuth();
        return;
      }
      if (isExpired(token)) {
        clearAuth();
        return;
      }
      // 서버에 실제 토큰 확인
      try {
        const { data } = await axios.get(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // 서버에서 받은 role이 있으면 우선 사용
        const serverRole = data?.role || savedRole;
        setRole(serverRole);
      } catch (e) {
        // 401/403 이면 즉시 로그아웃 처리
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          clearAuth();
        } else {
          // 네트워크 오류면 보수적으로 로그아웃 UI 유지
          setRole(null);
        }
      }
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  };

  // storage 이벤트(다른 탭) + 라우트 변경시 검증
  useEffect(() => {
    const onStorage = () => verifyAuth();
    window.addEventListener("storage", onStorage);
    verifyAuth(); // 최초 진입 시 검증
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // 라우트가 바뀔 때도 재검증 (로그인/로그아웃 후 화면 전환 등)
    verifyAuth();
    // eslint-disable-next-line
  }, [location]);

  const handleLogout = () => {
    clearAuth();
    // 다른 탭에도 알림 (storage 이벤트는 같은 탭에선 안 울리므로 수동 디스패치)
    try { window.dispatchEvent(new StorageEvent("storage", { key: "role" })); } catch {}
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#2d4373",
        padding: "10px 4vw",
        marginBottom: 24,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <Link
          style={{ color: "white", fontWeight: "bold", fontSize: 20, textDecoration: "none" }}
          to="/"
        >
          IG수학학원
        </Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/news">
          공지사항
        </Link>
        <Link to="/contact" style={{ color: "#fff", textDecoration: "none" }}>
          상담문의
        </Link>
        <Link to="/blog" style={{ color: "#fff", textDecoration: "none" }}>
          블로그최신글
        </Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/materials">
          자료실
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {/* 검증 전에는 보수적으로 로그인 UI만 보여줌 */}
        {!checking && role === "admin" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">
            관리자 대시보드
          </Link>
        )}
        {!checking && role === "student" && (
          <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">
            내 강의실
          </Link>
        )}

        {!checking && role ? (
          <button
            onClick={handleLogout}
            style={{
              background: "#fff",
              color: "#2d4373",
              border: "none",
              borderRadius: 8,
              padding: "6px 18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        ) : (
          <>
            <Link style={{ color: "white", textDecoration: "none" }} to="/login">
              로그인
            </Link>
            <Link style={{ color: "white", textDecoration: "none" }} to="/register">
              회원가입
            </Link>
          </>
        )}

        <a
          href="https://blog.naver.com/igmath2022"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            background: "#03c75a",
            borderRadius: 12,
            padding: "3px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            marginLeft: 8,
          }}
        >
          네이버블로그
        </a>
        <a
          href="https://www.youtube.com/@%EC%86%A1%EC%9D%B8%EA%B7%9C-m1r"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            background: "#ff0000",
            borderRadius: 12,
            padding: "3px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            marginLeft: 8,
          }}
        >
          유튜브
        </a>
        <a
          href="https://pf.kakao.com/_dSHvxj"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            background: "#FEE500",
            borderRadius: 12,
            padding: "3px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            marginLeft: 8,
          }}
        >
          카카오문의
        </a>
      </div>
    </nav>
  );
}

export default NavBar;
