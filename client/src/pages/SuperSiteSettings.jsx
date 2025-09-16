// client/src/pages/SuperSiteSettings.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getToken } from "../utils/auth";
import { applyTheme, fetchPublicSiteSettings, emitSiteSettingsUpdated } from "../utils/sitePublic";

const SEC_KEYS = [
  { key: "hero", label: "히어로" },
  { key: "about", label: "학원 소개" },
  { key: "teachers", label: "강사진" },
  { key: "schedule", label: "시간표" },
  { key: "blog", label: "블로그" },
];

export default function SuperSiteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    // 메뉴
    menu_home_on: true,
    menu_blog_on: true,
    menu_materials_on: true,
    menu_contact_on: true,
    // 테마
    site_theme_color: "#2d4373",
    site_theme_mode: "light",
    // 기본 반
    default_class_name: "IG수학",
    // 섹션 토글
    home_sections: SEC_KEYS.map(s => ({ key: s.key, on: true })),
    // 히어로/소개/블로그 노출
    hero_title: "IG수학학원",
    hero_subtitle: "학생의 꿈과 성장을 함께하는 개별맞춤 수학 전문 학원",
    hero_logo_url: "",
    about_md: "",
    blog_show: true,
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const token = getToken();
        const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error("load failed");
        const j = await r.json(); // { ok:true, settings:{...} }
        if (j?.ok && j.settings) {
          const s = j.settings;

          // home_sections 정규화(알 수 없는 key 제거, 누락 key는 추가)
          const known = new Set(SEC_KEYS.map(x => x.key));
          const map = new Map(
            (Array.isArray(s.home_sections) ? s.home_sections : [])
              .filter(x => x && known.has(x.key))
              .map(x => [x.key, !!x.on])
          );
          const merged = SEC_KEYS.map(x => ({ key: x.key, on: map.has(x.key) ? map.get(x.key) : true }));

          setForm({
            menu_home_on: s.menu_home_on !== "false" && s.menu_home_on !== false,
            menu_blog_on: s.menu_blog_on !== "false" && s.menu_blog_on !== false,
            menu_materials_on: s.menu_materials_on !== "false" && s.menu_materials_on !== false,
            menu_contact_on: s.menu_contact_on !== "false" && s.menu_contact_on !== false,
            site_theme_color: s.site_theme_color || "#2d4373",
            site_theme_mode: s.site_theme_mode === "dark" ? "dark" : "light",
            default_class_name: s.default_class_name || "IG수학",
            home_sections: merged,
            hero_title: s.hero_title || "IG수학학원",
            hero_subtitle: s.hero_subtitle || "학생의 꿈과 성장을 함께하는 개별맞춤 수학 전문 학원",
            hero_logo_url: s.hero_logo_url || "",
            about_md: s.about_md || "",
            blog_show: s.blog_show !== "false" && s.blog_show !== false,
          });
        }
      } catch {
        setErr("설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const token = getToken();
      const r = await fetch(`${API_URL}/api/admin/super/site-settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu_home_on: !!form.menu_home_on,
          menu_blog_on: !!form.menu_blog_on,
          menu_materials_on: !!form.menu_materials_on,
          menu_contact_on: !!form.menu_contact_on,
          site_theme_color: form.site_theme_color || "#2d4373",
          site_theme_mode: form.site_theme_mode === "dark" ? "dark" : "light",
          default_class_name: form.default_class_name || "IG수학",
          home_sections: form.home_sections,
          hero_title: form.hero_title || "",
          hero_subtitle: form.hero_subtitle || "",
          hero_logo_url: form.hero_logo_url || "",
          about_md: form.about_md || "",
          blog_show: !!form.blog_show,
        }),
      });
      if (!r.ok) throw new Error("save failed");
      const j = await r.json();
      if (!j.ok) throw new Error("save result not ok");

      // 저장 후 즉시 테마/메뉴 반영
      applyTheme({
        site_theme_color: form.site_theme_color,
        site_theme_mode: form.site_theme_mode,
      });
      emitSiteSettingsUpdated();

      setMsg("저장되었습니다.");
      setTimeout(() => setMsg(""), 1600);
    } catch {
      setErr("저장에 실패했습니다.");
      setTimeout(() => setErr(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Wrap><Muted>불러오는 중…</Muted></Wrap>;

  return (
    <Wrap>
      <h2 style={{ marginTop: 0 }}>슈퍼 관리자 설정</h2>

      <Card>
        <h3 style={{ marginTop: 0 }}>메뉴 표시</h3>
        <Grid2>
          <Row><Label>홈</Label><input type="checkbox" checked={!!form.menu_home_on} onChange={e => setField("menu_home_on", e.target.checked)} /></Row>
          <Row><Label>블로그</Label><input type="checkbox" checked={!!form.menu_blog_on} onChange={e => setField("menu_blog_on", e.target.checked)} /></Row>
          <Row><Label>자료실</Label><input type="checkbox" checked={!!form.menu_materials_on} onChange={e => setField("menu_materials_on", e.target.checked)} /></Row>
          <Row><Label>상담문의</Label><input type="checkbox" checked={!!form.menu_contact_on} onChange={e => setField("menu_contact_on", e.target.checked)} /></Row>
        </Grid2>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>테마</h3>
        <Row>
          <Label>대표 색상</Label>
          <div>
            <input type="color" value={form.site_theme_color} onChange={e => setField("site_theme_color", e.target.value)} />
            <span style={{ marginLeft: 8, color: "#666" }}>{form.site_theme_color}</span>
          </div>
        </Row>
        <Row>
          <Label>모드</Label>
          <select value={form.site_theme_mode} onChange={e => setField("site_theme_mode", e.target.value)}>
            <option value="light">라이트</option>
            <option value="dark">다크</option>
          </select>
        </Row>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>히어로</h3>
        <Row><Label>타이틀</Label><input value={form.hero_title} onChange={e=>setField("hero_title", e.target.value)} style={inp} placeholder="IG수학학원" /></Row>
        <Row><Label>서브타이틀</Label><input value={form.hero_subtitle} onChange={e=>setField("hero_subtitle", e.target.value)} style={inp} placeholder="소개 문구" /></Row>
        <Row><Label>로고 URL</Label><input value={form.hero_logo_url} onChange={e=>setField("hero_logo_url", e.target.value)} style={inp} placeholder="https://..." /></Row>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>학원 소개</h3>
        <Row full>
          <textarea value={form.about_md} onChange={e=>setField("about_md", e.target.value)} style={{ ...inp, width:"100%", minHeight:140 }} placeholder="학원 소개를 입력하세요" />
        </Row>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>홈 섹션 표시</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {SEC_KEYS.map(sec => {
            const item = form.home_sections.find(s => s.key === sec.key) || { key: sec.key, on: true };
            return (
              <div key={sec.key} className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontWeight: 700, minWidth: 120 }}>{sec.label}</label>
                <input
                  type="checkbox"
                  checked={!!item.on}
                  onChange={e => {
                    setForm(prev => ({
                      ...prev,
                      home_sections: prev.home_sections.map(s => s.key === sec.key ? { ...s, on: e.target.checked } : s)
                    }));
                  }}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>기타</h3>
        <Row><Label>기본 반 이름</Label><input value={form.default_class_name} onChange={e=>setField("default_class_name", e.target.value)} style={inp} placeholder="IG수학" /></Row>
        <Row><Label>블로그 노출</Label><input type="checkbox" checked={!!form.blog_show} onChange={e=>setField("blog_show", e.target.checked)} /></Row>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          className="btn"
          onClick={async () => {
            try {
              const j = await fetchPublicSiteSettings();
              alert(JSON.stringify(j?.settings || {}, null, 2));
            } catch {
              alert("공개 설정 조회 실패");
            }
          }}
        >
          공개 설정 확인
        </button>
      </div>

      {msg && <Alert ok>{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
    </Wrap>
  );
}

/* ---- 스타일 유틸 ---- */
const Wrap = ({ children }) => (
  <div style={{ maxWidth: 880, margin: "24px auto", padding: "0 4vw" }}>{children}</div>
);
const Card = ({ children }) => (
  <div className="card" style={{ padding: 16, marginBottom: 14 }}>{children}</div>
);
const Grid2 = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>{children}</div>
);
const Row = ({ children, full }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap", ...(full ? { width:"100%"}:{} ) }}>{children}</div>
);
const Label = ({ children }) => (
  <div style={{ width: 120, color: "#555", fontWeight: 700 }}>{children}</div>
);
const Muted = ({ children }) => <div style={{ color: "#888" }}>{children}</div>;
const Alert = ({ children, ok }) => (
  <div style={{
    marginTop: 12,
    color: ok ? "#1b7b1b" : "#b71818",
    fontWeight: 700
  }}>{children}</div>
);
const inp = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8, minWidth: 220 };
