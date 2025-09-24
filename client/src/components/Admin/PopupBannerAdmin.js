import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken } from "../../utils/auth";

/**
 * PopupBannerAdmin
 * - 배너 3개(이미지/제목/본문/링크/표시여부)를 관리
 * - 이미지 업로드: POST /api/banner/upload  (multipart/form-data) -> { url }
 * - 설정 조회:     GET  /api/super/site-settings  → 실패 시 GET /api/site/public
 * - 설정 저장:     POST /api/super/site-settings  (payload 내 popupBanners: [{...},{...},{...}])
 *
 * 데이터 스키마:
 *   popupBanners: Array<{
 *     imageUrl: string,
 *     title: string,
 *     body: string,
 *     linkUrl: string,
 *     linkText: string,
 *     visible: boolean
 *   }>
 */

const EMPTY = { imageUrl: "", title: "", body: "", linkUrl: "", linkText: "", visible: true };

function useAuthHeaders() {
  return useMemo(() => {
    const t = getToken?.();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);
}

export default function PopupBannerAdmin() {
  const headers = useAuthHeaders();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState([{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }]);
  const [files, setFiles] = useState([null, null, null]);
  const [uploading, setUploading] = useState([false, false, false]);

  // ───────────────────────────────── 조회 ─────────────────────────────────
  async function loadSettings() {
    setLoading(true);
    try {
      // 1) 관리자 전체 설정 우선
      const { data } = await axios.get(`${API_URL}/api/super/site-settings`, {
        headers,
      });
      const arr = Array.isArray(data?.popupBanners) ? data.popupBanners : [];
      setBanners([0, 1, 2].map((i) => ({ ...EMPTY, ...(arr[i] || {}) })));
    } catch (e1) {
      // 2) 공개용 폴백
      try {
        const { data } = await axios.get(`${API_URL}/api/site/public`);
        const arr = Array.isArray(data?.popupBanners) ? data.popupBanners : [];
        setBanners([0, 1, 2].map((i) => ({ ...EMPTY, ...(arr[i] || {}) })));
      } catch (e2) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[PopupBannerAdmin] load failed:", e1?.message || e1, e2?.message || e2);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────── 업로드 ─────────────────────────────────
  function onPick(idx, e) {
    const f = (e.target.files || [])[0] || null;
    setFiles((old) => {
      const next = [...old];
      next[idx] = f;
      return next;
    });
  }

  async function uploadOne(idx) {
    const file = files[idx];
    if (!file) {
      alert("먼저 파일을 선택하세요.");
      return;
    }
    setUploading((old) => {
      const n = [...old];
      n[idx] = true;
      return n;
    });
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post(`${API_URL}/api/banner/upload`, form, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      const url = data?.url || "";
      if (!url) throw new Error("업로드 응답에 url이 없습니다.");
      setBanners((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], imageUrl: url };
        return next;
      });
      alert("이미지 업로드 완료");
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("팝업 배너 이미지 업로드 실패:", e);
      }
      alert(`업로드 실패: ${e?.message || e}`);
    } finally {
      setUploading((old) => {
        const n = [...old];
        n[idx] = false;
        return n;
      });
    }
  }

  // ───────────────────────────────── 저장 ─────────────────────────────────
  async function saveAll() {
    setSaving(true);
    try {
      // 기존 설정 불러와 merge (다른 키 보존)
      let base = {};
      try {
        const { data } = await axios.get(`${API_URL}/api/super/site-settings`, { headers });
        base = data && typeof data === "object" ? data : {};
      } catch {
        base = {};
      }
      const payload = { ...base, popupBanners: banners };
      await axios.post(`${API_URL}/api/super/site-settings`, payload, { headers });

      // 저장 직후 재조회(새로고침과 일치 보장)
      await loadSettings();
      alert("팝업 배너 설정이 저장되었습니다.");
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("팝업 배너 설정 저장 실패:", e);
      }
      alert("설정 저장 실패(권한 또는 서버 라우트 확인 필요)");
    } finally {
      setSaving(false);
    }
  }

  // ───────────────────────────────── UI 헬퍼 ─────────────────────────────────
  function setField(idx, key, val) {
    setBanners((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  }

  function resetBanner(idx) {
    if (typeof window !== "undefined") {
      const confirmClear = window.confirm("배너 내용을 모두 비울까요?");
      if (!confirmClear) return;
    }
    setBanners((prev) => {
      const next = [...prev];
      next[idx] = { ...EMPTY, visible: false };
      return next;
    });
    setFiles((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
    setUploading((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });
  }

  // ───────────────────────────────── 렌더 ─────────────────────────────────
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#5b6a8a", fontSize: 13 }}>
        * 이미지 업로드는 <code>/api/banner/upload</code> 로 처리되며, 설정은{" "}
        <code>/api/super/site-settings</code> 의 <code>popupBanners</code>로 저장됩니다.
      </div>

      {loading ? (
        <div>설정 불러오는 중...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {[0, 1, 2].map((i) => {
            const b = banners[i];
            return (
              <div
                key={i}
                style={{
                  border: "1px solid #e6eaf1",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 800, color: "#1d2742" }}>팝업 배너 #{i + 1}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#37446b" }}>
                      <input
                        type="checkbox"
                        checked={!!b.visible}
                        onChange={(e) => setField(i, "visible", e.target.checked)}
                      />
                      표시
                    </label>
                    <button
                      type="button"
                      onClick={() => resetBanner(i)}
                      disabled={uploading[i]}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #f3b6b6",
                        background: "#fff5f5",
                        color: "#d14b4b",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      비우기
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                  <input type="file" accept="image/*" onChange={(e) => onPick(i, e)} />
                  <button
                    onClick={() => uploadOne(i)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #c9d5ff",
                      background: "#eef2ff",
                      color: "#2d4373",
                      fontWeight: 700,
                    }}
                    disabled={uploading[i]}
                  >
                    {uploading[i] ? "업로드 중..." : "업로드"}
                  </button>
                </div>

                <input
                  value={b.imageUrl}
                  onChange={(e) => setField(i, "imageUrl", e.target.value)}
                  placeholder="배너 이미지 URL"
                  style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10 }}
                />

                {!!b.imageUrl && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <img
                      src={b.imageUrl}
                      alt={`banner-${i + 1}`}
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: 180,
                        objectFit: "contain",
                        borderRadius: 8,
                        border: "1px solid #eef1f6",
                        background: "#fafbfe",
                      }}
                    />
                    <a
                      href={b.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#226ad6", fontWeight: 600 }}
                    >
                      원본 보기
                    </a>
                  </div>
                )}

                <input
                  value={b.title}
                  onChange={(e) => setField(i, "title", e.target.value)}
                  placeholder="배너 제목"
                  style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10 }}
                />
                <textarea
                  rows={3}
                  value={b.body}
                  onChange={(e) => setField(i, "body", e.target.value)}
                  placeholder="배너 본문(간단 설명)"
                  style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10, resize: "vertical" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                  <input
                    value={b.linkUrl}
                    onChange={(e) => setField(i, "linkUrl", e.target.value)}
                    placeholder="버튼/배너 링크 URL"
                    style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10 }}
                  />
                  <input
                    value={b.linkText}
                    onChange={(e) => setField(i, "linkText", e.target.value)}
                    placeholder="버튼 텍스트 (예: 자세히 보기)"
                    style={{ padding: 10, border: "1px solid #dfe4ec", borderRadius: 10 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={loadSettings}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #dfe4ec", background: "#fff" }}
          disabled={loading}
        >
          새로고침
        </button>
        <button
          onClick={saveAll}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #c9d5ff",
            background: "#eef2ff",
            color: "#2d4373",
            fontWeight: 800,
          }}
          disabled={saving}
        >
          {saving ? "저장 중..." : "설정 저장"}
        </button>
      </div>
    </div>
  );
}
