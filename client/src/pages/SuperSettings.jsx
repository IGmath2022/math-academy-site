// client/src/pages/SuperSettings.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getToken, clearAuth } from "../utils/auth";
import { getSiteSettings, saveSiteSettings } from "../utils/superApi";
import { applyTheme, emitSiteSettingsUpdated } from "../utils/sitePublic";

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
    home_sections: [
      { key: "hero", on: true },
      { key: "features", on: true },
      { key: "stats", on: true },
      { key: "cta", on: true },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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

  useEffect(() => {
    if (loadingMe || role !== "super") return;
    (async () => {
      try {
        setLoading(true);
        const { settings: s } = await getSiteSettings();
        const strBool = (v) => (typeof v === "boolean" ? v : String(v) === "true");

        const STD_SECS = ["hero", "features", "stats", "cta"];
        const allow = new Set(STD_SECS);
        let secs = Array.isArray(s.home_sections) ? s.home_sections : [];
        const map = new Map(secs.filter(x => x && allow.has(x.key)).map(x => [x.key, !!x.on]));
        const merged = STD_SECS.map(k => ({ key: k, on: map.has(k) ? map.get(k) : true }));

        setSettings({
          menu_home_on: strBool(s.menu_home_on) ? "true" : "false",
          menu_blog_on: strBool(s.menu_blog_on) ? "true" : "false",
          menu_materials_on: strBool(s.menu_materials_on) ? "true" : "false",
          menu_contact_on: strBool(s.menu_contact_on) ? "true" : "false",
          site_theme_color: s.site_theme_color || "#2d4373",
          site_theme_mode: s.site_theme_mode === "dark" ? "dark" : "light",
          default_class_name: s.default_class_name || "IG수학",
          home_sections: merged,
        });
      } catch {
        setErr("설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadingMe, role]);

  if (loadingMe) return <PageWrap><CenterText>권한 확인 중…</CenterText></PageWrap>;
  if (role !== "super") return <PageWrap><CenterText>접근 권한이 없습니다. (슈퍼 전용)</CenterText></PageWrap>;

  const onChange = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));
  const toggleSection = (idx) => {
    setSettings(prev => {
      const list = [...(prev.home_sections || [])];
      list[idx] = { ...list[idx], on: !list[idx].on };
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

      // 저장 직후 즉시 테마/메뉴 반영
      applyTheme({
        site_theme_color: payload.site_theme_color,
        site_theme_mode: payload.site_theme_mode,
      });
      emitSiteSettingsUpdated();

      setMsg("저장되었습니다.");
      setTimeout(() => setMsg(""), 1800);
    } catch {
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
              <Switch label="홈"         value={settings.menu_home_on}        onChange={(v) => onChange("menu_home_on", v)} />
              <Switch label="블로그"     value={settings.menu_blog_on}        onChange={(v) => onChange("menu_blog_on", v)} />
              <Switch label="자료실"     value={settings.menu_materials_on}   onChange={(v) => onChange("menu_materials_on", v)} />
              <Switch label="상담문의"   value={settings.menu_contact_on}     onChange={(v) => onChange("menu_contact_on", v)} />
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
            <SectionTitle>홈 섹션 표시</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {(settings.home_sections || []).map((s, i) => (
                <div
                  key={s.key || i}
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
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </PageWrap>
  );
}

/* ---- UI ---- */
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
const PageWrap = ({ children }) => (<div style={{ maxWidth: 960, margin: "24px auto", padding: "0 4vw" }}>{children}</div>);
const Header = ({ children }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
    {children}
  </div>
);
const Panel = ({ children }) => (<div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:14, marginBottom:12 }}>{children}</div>);
const SectionTitle = ({ children }) => (<div style={{ fontWeight: 800, marginBottom: 10 }}>{children}</div>);
const CenterText = ({ children }) => (<div style={{ textAlign:"center", color:"#888", padding:"40px 0" }}>{children}</div>);
const btn = { padding:"7px 12px", border:"1px solid #ddd", borderRadius:8, background:"#fff", cursor:"pointer", fontWeight:600 };
const btnPrimary = { padding:"8px 14px", border:"none", borderRadius:10, background:"#226ad6", color:"#fff", cursor:"pointer", fontWeight:800 };
const inp = { padding:"8px 10px", border:"1px solid #ccc", borderRadius:8, minWidth:180 };
