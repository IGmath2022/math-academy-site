// client/src/components/Admin/AdminNoticeManager.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken } from "../../utils/auth";

/**
 * AdminNoticeManager
 * - 공지 CRUD: /api/news
 * - 토큰 헤더 추가(Authorization: Bearer <token>) → 401 해결
 * - UI는 이전 개선 스타일 유지
 */

function useAuthHeaders() {
  // 매 렌더마다 토큰 읽어와 헤더 구성
  return useMemo(() => {
    const t = getToken?.();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);
}

export default function AdminNoticeManager() {
  const authHeaders = useAuthHeaders();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // 목록은 공개일 수 있으나, 서버 정책 따라 보호돼 있을 가능성도 있어 헤더 포함 허용
      const { data } = await axios.get(`${API_URL}/api/news`, {
        headers: authHeaders,
      });
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("공지 목록 불러오기 실패:", e);
      }
      alert("공지 목록 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFile(e) {
    setFiles(Array.from(e.target.files || []));
  }

  async function submit() {
    if (!title.trim()) return alert("제목을 입력하세요.");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title || "");
      form.append("content", content || "");
      for (const f of files) form.append("files", f);

      if (editing) {
        // 수정
        await axios.put(`${API_URL}/api/news/${editing._id}`, form, {
          headers: {
            ...authHeaders,
            // Content-Type은 FormData 사용 시 axios가 자동 설정해도 되지만,
            // 일부 서버에서 요구하므로 명시 유지해도 무방
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // 신규
        await axios.post(`${API_URL}/api/news`, form, {
          headers: {
            ...authHeaders,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      setTitle("");
      setContent("");
      setFiles([]);
      setEditing(null);
      await load();
      alert("공지 저장 완료");
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("공지 저장 실패:", e);
      }
      // 401/403 구분 안내
      const status = e?.response?.status;
      if (status === 401) {
        alert("인증이 필요합니다. 다시 로그인해주세요. (401)");
      } else if (status === 403) {
        alert("권한이 없습니다. 관리자/슈퍼 권한을 확인해주세요. (403)");
      } else {
        alert("저장 실패(권한/서버 확인 필요)");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${API_URL}/api/news/${id}`, {
        headers: authHeaders,
      });
      load();
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("공지 삭제 실패:", e);
      }
      const status = e?.response?.status;
      if (status === 401) {
        alert("인증이 필요합니다. 다시 로그인해주세요. (401)");
      } else if (status === 403) {
        alert("권한이 없습니다. 관리자/슈퍼 권한을 확인해주세요. (403)");
      } else {
        alert("삭제 실패");
      }
    }
  }

  function editRow(row) {
    setEditing(row);
    setTitle(row.title || "");
    setContent(row.content || "");
    setFiles([]);
  }

  function resetForm() {
    setEditing(null);
    setTitle("");
    setContent("");
    setFiles([]);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* 작성 카드 */}
      <div
        style={{
          border: "1px solid #e6eaf1",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 6px 20px rgba(25,35,60,.06)",
        }}
      >
        <div style={{ padding: "12px 12px 0" }}>
          <h3 style={{ margin: 0, fontWeight: 800, color: "#1c2434", fontSize: 17 }}>
            공지 {editing ? "수정" : "작성"}
          </h3>
          <div style={{ marginTop: 6, color: "#667085", fontSize: 13 }}>
            제목/본문/첨부를 입력 후 {editing ? "수정 저장" : "등록"}하세요.
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10 }}
            />
            <textarea
              rows={6}
              placeholder="내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10, resize: "vertical" }}
            />
            <input type="file" multiple onChange={onFile} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={submit}
              disabled={saving}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #c9d5ff",
                background: "#eef2ff",
                color: "#2d4373",
                fontWeight: 800,
              }}
            >
              {saving ? "저장 중..." : editing ? "수정 저장" : "등록"}
            </button>
            {editing && (
              <button
                onClick={resetForm}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #dfe4ec", background: "#fff" }}
              >
                새 글
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 목록 카드 */}
      <div
        style={{
          border: "1px solid #e6eaf1",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 6px 20px rgba(25,35,60,.06)",
        }}
      >
        <div style={{ padding: "12px 12px 0" }}>
          <h3 style={{ margin: 0, fontWeight: 800, color: "#1c2434", fontSize: 17 }}>공지 목록</h3>
          <div style={{ marginTop: 6, color: "#667085", fontSize: 13 }}>
            최근 공지부터 표시됩니다.
          </div>
        </div>

        <div style={{ padding: 12 }}>
          {loading ? (
            <div>로딩중...</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {list.map((n) => {
                const preview =
                  (n.content || "")
                    .replace(/\n+/g, " ")
                    .slice(0, 120) + ((n.content || "").length > 120 ? "…" : "");
                return (
                  <div
                    key={n._id}
                    style={{
                      border: "1px solid #eef1f6",
                      borderRadius: 10,
                      padding: 12,
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 800, color: "#223" }}>{n.title}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => editRow(n)}
                          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #dfe4ec", background: "#fff" }}
                        >
                          편집
                        </button>
                        <button
                          onClick={() => remove(n._id)}
                          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ffe1e1", background: "#fff5f5", color: "#b42318", fontWeight: 700 }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div style={{ color: "#445067", marginTop: 6, fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {preview || "-"}
                    </div>

                    {Array.isArray(n.files) && n.files.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {n.files.map((f, idx) => (
                          <a
                            key={idx}
                            href={`${API_URL}/api/news/download/${encodeURIComponent(f)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, color: "#226ad6" }}
                          >
                            첨부 {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {list.length === 0 && (
                <div style={{ color: "#98a2b3" }}>등록된 공지가 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
