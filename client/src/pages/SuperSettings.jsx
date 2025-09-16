// client/src/pages/SuperSettings.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getToken, clearAuth } from "../utils/auth";
import { getSiteSettings, saveSiteSettings } from "../utils/superApi";

/** 라디오 + 컬러 + 스위치 + 리스트 편집 UI가 포함된 슈퍼 전역 설정 페이지 */
export default function SuperSettings() {
  const [role, setRole] = useState("");
  const [loadingMe, setLoadingMe] = useState(true);

  const [settings, setSettings] = useState({
    menu_home_on: "true",
    menu_blog_on: "true",
    menu_materials_on: "true",
    menu_contact_on: "true",
    site_theme_color: "#2d4373",
    site_theme_mode: "light",
    default_class_name: "IG수학",
    home_sections: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // 권한 체크: 슈퍼만 접근
  useEffect(() => {
    (async () => {
      const t = getToken();
      if (!t) {
        setRole("");
        setLoadingMe(false);
        return;
      }
      try {
        const r = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!r.ok) throw new Error("me failed");
        const me = await r.json();
        setRole(me?.role || "");
      } catch {
        clearAuth();
        setRole("");
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // 설정 로드
  useEffect(() => {
    if (loadingMe || role !== "super") return;
    (async () => {
      try {
        setLoading(true);
        const { settings: s } = await getSiteSettings();
        setSettings({
          menu_home_on: strBool(s.menu_home_on) ? "true" : "false",
          menu_blog_on: strBool(s.menu_blog_on) ? "true" : "false",
          menu_materials_on: strBool(s.menu_materials_on) ? "true" : "false",
          menu_contact_on: strBool(s.menu_contact_on) ? "true" : "false",
          site_theme_color: s.site_theme_color || "#2d4373",
          site_theme_mode: s.site_theme_mode === "dark" ? "dark" : "light",
          default_class_name: s.default_class_name || "IG수학",
          home_sections: Array.isArray(s.home_sections) ? s.home_sections : [],
        });
      } catch (e) {
        setErr("설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadingMe, role]);

  if (loadingMe)
    return <PageWrap><CenterText>권한 확인 중…</CenterText></PageWrap>;
  if (role !== "super")
    return <PageWrap><CenterText>접근 권한이 없습니다. (슈퍼 전용)</CenterText></PageWrap>;

  const onChange = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

  const addSection = () => {
    const key = prompt("섹션 key를 입력하세요 (예: hero, features, testimonials)");
    if (!key) return;
    setSettings(prev => ({
      ...prev,
      home_sections: [...(prev.home_sections || []), { key: String(key), on: true }],
    }));
  };

  const toggleSection = (idx) => {
    setSettings(prev => {
      const list = [...(prev.home_sections || [])];
      list[idx] = { ...list[idx], on: !list[idx].on };
      return { ...prev, home_sections: list };
    });
  };

  const removeSection = (idx) => {
    if (!window.confirm("해당 섹션을 제거할까요?")) return;
    setSettings(prev => {
      const list = [...(prev.home_sections || [])];
      list.splice(idx, 1);
      return { ...prev, home_sections: list };
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setMsg("");
      setErr("");

      const payload = {
        menu_home_on: settings.menu_home_on === "true",
        menu_blog_on: settings.menu_blog_on === "true",
        menu_materials_on: settings.menu_materials_on === "true",
        menu_contact_on: settings.menu_contact_on === "true",
        site_theme_color: settings.site_theme_color || "#2d4373",
        site_theme_mode: settings.site_theme_mode === "dark" ? "dark" : "light",
        default_class_name: settings.default_class_name || "IG수학",
        home_sections: Array.isArray(settings.home_sections) ? settings.home_sections : [],
      };

      await saveSiteSettings(payload);
      setMsg("저장되었습니다.");
      setTimeout(() => setMsg(""), 1800);
    } catch (e) {
      setErr("저장 실패");
      setTimeout(() => setErr(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrap>
      <Header>
        <h2 style={{ margin: 0, fontSize: 20 }}>사이트 전역 설정 (슈퍼)</h2>
        <div>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </Header>

      {msg && <Alert ok>{msg}</Alert>}
      {err && <Alert>{err}</Alert>}

      {loading ? (
        <Panel><CenterText>불러오는 중…</CenterText></Panel>
      ) : (
        <>
          <Panel>
            <SectionTitle>메뉴 노출</SectionTitle>
            <Row>
              <Switch
                label="홈"
                value={settings.menu_home_on}
                onChange={(v) => onChange("menu_home_on", v)}
              />
              <Switch
                label="블로그"
                value={settings.menu_blog_on}
                onChange={(v) => onChange("menu_blog_on", v)}
              />
              <Switch
                label="자료실"
                value={settings.menu_materials_on}
                onChange={(v) => onChange("menu_materials_on", v)}
              />
              <Switch
                label="상담문의"
                value={settings.menu_contact_on}
                onChange={(v) => onChange("menu_contact_on", v)}
              />
            </Row>
          </Panel>

          <Panel>
            <SectionTitle>테마</SectionTitle>
            <Row>
              <Field label="메인 색상">
                <input
                  type="color"
                  value={settings.site_theme_color || "#2d4373"}
                  onChange={(e) => onChange("site_theme_color", e.target.value)}
                  style={{ width: 60, height: 34, border: "none", background: "transparent" }}
                />
                <input
                  type="text"
                  value={settings.site_theme_color || ""}
                  onChange={(e) => onChange("site_theme_color", e.target.value)}
                  style={inp}
                />
              </Field>
              <Field label="모드">
                <label style={{ marginRight: 10 }}>
                  <input
                    type="radio"
                    name="theme_mode"
                    checked={settings.site_theme_mode === "light"}
                    onChange={() => onChange("site_theme_mode", "light")}
                  />{" "}
                  Light
                </label>
                <label>
                  <input
                    type="radio"
                    name="theme_mode"
                    checked={settings.site_theme_mode === "dark"}
                    onChange={() => onChange("site_theme_mode", "dark")}
                  />{" "}
                  Dark
                </label>
              </Field>
            </Row>
          </Panel>

          <Panel>
            <SectionTitle>기본 반 이름</SectionTitle>
            <Row>
              <Field label="기본 반명">
                <input
                  type="text"
                  value={settings.default_class_name || ""}
                  onChange={(e) => onChange("default_class_name", e.target.value)}
                  style={inp}
                  placeholder="예: IG수학"
                />
              </Field>
            </Row>
          </Panel>

          <Panel>
            <SectionTitle>홈 섹션</SectionTitle>
            <div style={{ marginBottom: 10 }}>
              <button onClick={addSection} style={btn}>+ 섹션 추가</button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {(settings.home_sections || []).map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    border: "1px solid #e5e5e5",
                    borderRadius: 10,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <strong>{s.key}</strong>
                    <span style={{ color: "#999" }}>{s.on ? "ON" : "OFF"}</span>
                  </div>
                  <div>
                    <button onClick={() => toggleSection(i)} style={btn}>
                      {s.on ? "끄기" : "켜기"}
                    </button>
                    <button
                      onClick={() => removeSection(i)}
                      style={{ ...btn, marginLeft: 8, color: "#e14", borderColor: "#f1caca" }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {(settings.home_sections || []).length === 0 && (
                <div style={{ color: "#888" }}>등록된 섹션이 없습니다.</div>
              )}
            </div>
          </Panel>
        </>
      )}
    </PageWrap>
  );
}

/* ---------------- UI 유틸 ---------------- */
function strBool(v) {
  if (typeof v === "boolean") return v;
  return String(v) === "true";
}

function Switch({ label, value, onChange }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 18 }}>
      <input
        type="checkbox"
        checked={String(value) === "true"}
        onChange={(e) => onChange(e.target.checked ? "true" : "false")}
      />
      {label}
    </label>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ minWidth: 240 }}>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

/* ---------------- 스타일 컴포넌트(로컬 정의 추가: Alert, Row 포함) ---------------- */
const PageWrap = ({ children }) => (
  <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 4vw" }}>{children}</div>
);

const Header = ({ children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#fff",
      border: "1px solid #e5e5e5",
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const Panel = ({ children }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e5e5e5",
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontWeight: 800, marginBottom: 10 }}>{children}</div>
);

const CenterText = ({ children }) => (
  <div style={{ textAlign: "center", color: "#888", padding: "40px 0" }}>{children}</div>
);

const Alert = ({ children, ok }) => (
  <div style={{ marginTop: 12, color: ok ? "#1b7b1b" : "#b71818", fontWeight: 700 }}>
    {children}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
    {children}
  </div>
);

const btn = {
  padding: "7px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const btnPrimary = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 10,
  background: "#226ad6",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const inp = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8, minWidth: 180 };
