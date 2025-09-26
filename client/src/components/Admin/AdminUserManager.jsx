// client/src/components/Admin/AdminUserManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken, clearAuth } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

const ipt = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d8deea",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
};

const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#2d4373",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhost = {
  ...btnPrimary,
  background: "#f1f4fb",
  color: "#2d4373",
};

const btnDanger = {
  ...btnPrimary,
  background: "#dc3545",
  color: "#fff",
};

const th = {
  padding: "10px 12px",
  textAlign: "left",
  borderBottom: "1px solid #e6ecf5",
  background: "#f8faff",
  fontSize: 13,
  color: "#3a4762",
};

const td = {
  padding: "10px 12px",
  borderBottom: "1px solid #eef1f7",
  fontSize: 13,
};

export default function AdminUserManager() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const roleOptions = useMemo(
    () => [
      { value: "teacher", label: "강사" },
      { value: "admin", label: "관리자" },
    ],
    []
  );
  const displayRoles = useMemo(() => ["admin", "teacher"], []);

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate("/login");
      return true;
    }
    return false;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, withAuth());
      const list = Array.isArray(data) ? data.filter((user) => displayRoles.includes(user.role)) : [];
      setUsers(list);
    } catch (e) {
      if (handle401(e)) return;
      setError(e?.response?.data?.message || "계정 목록을 불러오지 못했습니다.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetMsgLater = () => {
    if (!msg) return;
    setTimeout(() => setMsg(""), 2000);
  };

  useEffect(resetMsgLater, [msg]);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setMsg("");
    const { name, email, password, role } = form;
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("이름, 이메일, 비밀번호를 모두 입력해 주세요.");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/admin/users`,
        { name: name.trim(), email: email.trim(), password: password.trim(), role },
        withAuth()
      );
      setMsg("새 계정을 생성했습니다.");
      setForm({ name: "", email: "", password: "", role });
      await load();
    } catch (e) {
      if (handle401(e)) return;
      setError(e?.response?.data?.message || "계정 생성에 실패했습니다.");
    }
  };

  const toggleActive = async (id, active) => {
    setPendingId(id);
    setError("");
    setMsg("");
    try {
      await axios.patch(
        `${API_URL}/api/admin/users/${id}/active`,
        { active: !active },
        withAuth()
      );
      setMsg(!active ? "계정을 활성화했습니다." : "계정을 비활성화했습니다.");
      await load();
    } catch (e) {
      if (handle401(e)) return;
      setError(e?.response?.data?.message || "계정 상태 변경에 실패했습니다.");
    } finally {
      setPendingId("");
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`정말로 '${name}' 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMsg("");
    try {
      await axios.delete(`${API_URL}/api/users/${id}`, withAuth());
      setMsg("계정이 삭제되었습니다.");
      await load();
    } catch (e) {
      if (handle401(e)) return;
      setError(e?.response?.data?.message || "계정 삭제에 실패했습니다.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          alignItems: "end",
          background: "#f8faff",
          border: "1px solid #e3ebfb",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#384362" }}>이름</label>
          <input
            type="text"
            value={form.name}
            style={ipt}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="예) 홍길동"
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#384362" }}>이메일(ID)</label>
          <input
            type="email"
            value={form.email}
            style={ipt}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="teacher@example.com"
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#384362" }}>초기 비밀번호</label>
          <input
            type="password"
            value={form.password}
            style={ipt}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="영문/숫자 조합 권장"
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#384362" }}>권한</label>
          <select
            value={form.role}
            onChange={(e) => onChange("role", e.target.value)}
            style={{ ...ipt, cursor: "pointer" }}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" style={btnPrimary}>
            계정 생성
          </button>
          <button type="button" style={btnGhost} onClick={() => load()}>
            새로고침
          </button>
        </div>
      </form>

      {(msg || error) && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: error ? "#fff0f0" : "#f0fff6",
            color: error ? "#c43d3d" : "#1f7a48",
            border: `1px solid ${error ? "#f5c7c7" : "#cfe8d8"}`,
            fontSize: 13,
          }}
        >
          {error || msg}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr>
              <th style={th}>이름</th>
              <th style={th}>이메일</th>
              <th style={th}>권한</th>
              <th style={th}>활성</th>
              <th style={th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: "center", color: "#7a859d" }}>
                  {loading ? "불러오는 중입니다." : "등록된 관리자/강사 계정이 없습니다."}
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user._id}>
                <td style={td}>{user.name || "-"}</td>
                <td style={td}>{user.email}</td>
                <td style={td}>{user.role === "admin" ? "관리자" : "강사"}</td>
                <td style={td}>{user.active ? "Y" : "N"}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      style={{
                        ...btnGhost,
                        padding: "6px 12px",
                        fontSize: "12px",
                        opacity: pendingId === user._id ? 0.6 : 1,
                      }}
                      disabled={pendingId === user._id || deletingId === user._id}
                      onClick={() => toggleActive(user._id, user.active)}
                    >
                      {user.active ? "비활성" : "활성"}
                    </button>
                    <button
                      type="button"
                      style={{
                        ...btnDanger,
                        padding: "6px 12px",
                        fontSize: "12px",
                        opacity: deletingId === user._id ? 0.6 : 1,
                      }}
                      disabled={pendingId === user._id || deletingId === user._id}
                      onClick={() => deleteUser(user._id, user.name)}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
