// client/src/pages/SuperSettings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../api";
import { getToken, clearAuth } from "../utils/auth";
import { getSiteSettings, saveSiteSettings } from "../utils/superApi";
import { emitSiteSettingsUpdated, persistThemeSnapshot, applyTheme } from "../utils/sitePublic";

/** 슈퍼 관리자용 공개 사이트 설정 페이지 */

const INITIAL_SETTINGS = {
  menu_home_on: "true",
  menu_blog_on: "true",
  menu_materials_on: "true",
  menu_contact_on: "true",
  menu_news_on: "true",
  blog_show: "true",
  site_theme_color: "#2d4373",
  site_theme_mode: "light",
  default_class_name: "IG수학",
  home_sections: [],
  hero_title: "",
  hero_subtitle: "",
  hero_logo_url: "",
  about_md: "",
  teachers_intro: "",
  teachers_list: "",
  academy_name: "",
  principal_name: "",
  academy_address: "",
  academy_phone: "",
  academy_email: "",
  founded_year: "",
  academy_description: "",
  header_logo: "",
  favicon: "",
  loading_logo: "",
  primary_color: "#2d4373",
  secondary_color: "#f8faff",
  accent_color: "#226ad6",
  title_font: "Noto Sans KR",
  body_font: "system-ui",
};

const THEME_PRESETS = [
  {
    key: "classic-navy",
    label: "Classic Navy",
    description: "차분한 네이비와 밝은 회색 조합",
    siteThemeColor: "#2d4373",
    siteThemeMode: "light",
    primary: "#2d4373",
    secondary: "#f5f7fb",
    accent: "#226ad6",
  },
  {
    key: "emerald-fresh",
    label: "Emerald Fresh",
    description: "산뜻한 에메랄드와 미색",
    siteThemeColor: "#1f8a70",
    siteThemeMode: "light",
    primary: "#1f8a70",
    secondary: "#f4fbf7",
    accent: "#2fbf71",
  },
  {
    key: "sunrise",
    label: "Sunrise Warm",
    description: "따뜻한 오렌지 포인트",
    siteThemeColor: "#e07a3f",
    siteThemeMode: "light",
    primary: "#e07a3f",
    secondary: "#fff7f0",
    accent: "#f0a35e",
  },
  {
    key: "slate-minimal",
    label: "Slate Minimal",
    description: "모던한 슬레이트 톤",
    siteThemeColor: "#465870",
    siteThemeMode: "light",
    primary: "#465870",
    secondary: "#f1f4f8",
    accent: "#7688a3",
  },
  {
    key: "midnight",
    label: "Midnight Focus",
    description: "어두운 배경에 선명한 포인트",
    siteThemeColor: "#1b2430",
    siteThemeMode: "dark",
    primary: "#1b2430",
    secondary: "#2f3a4a",
    accent: "#4f8cff",
  },
];

const HOME_SECTION_KEY_NORMALIZE = {
  stats: 'schedule',
  statistics: 'schedule',
  features: 'about',
  testimonials: 'teachers',
  contact: 'schedule',
  cta: 'blog',
};

const HOME_SECTION_CHOICES = [
  { key: "hero", label: "메인 히어로", description: "첫 화면 상단 소개 배너" },
  { key: "about", label: "학원 소개", description: "원장 인사말 / 학원 소개 문구" },
  { key: "schedule", label: "위치 안내", description: "지도 및 연락처 요약" },
  { key: "teachers", label: "강사진 소개", description: "대표 강사 소개 섹션" },
  { key: "blog", label: "블로그 최신글", description: "블로그 최신 게시물 소개" },
];

const boolToStr = (value) => (value ? "true" : "false");

function boolValue(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return strBool(fallback);
  }
  return strBool(value);
}

function sanitizeStr(value, fallback = "") {
  if (value === undefined || value === null) return fallback || "";
  const trimmed = String(value).trim();
  return trimmed || fallback || "";
}

function normalizeHomeSections(list = []) {
  const map = new Map();
  for (const item of list) {
    const normalizedKey = HOME_SECTION_KEY_NORMALIZE[item.key] || item.key;
    if (!map.has(normalizedKey)) map.set(normalizedKey, !!item.on);
  }
  return HOME_SECTION_CHOICES.map(({ key }) => ({ key, on: map.get(key) ?? false }));
}

function toStateShape(input = {}) {
  return {
    ...INITIAL_SETTINGS,
    menu_home_on: boolToStr(boolValue(input.menu_home_on, INITIAL_SETTINGS.menu_home_on)),
    menu_blog_on: boolToStr(boolValue(input.menu_blog_on, INITIAL_SETTINGS.menu_blog_on)),
    menu_materials_on: boolToStr(boolValue(input.menu_materials_on, INITIAL_SETTINGS.menu_materials_on)),
    menu_contact_on: boolToStr(boolValue(input.menu_contact_on, INITIAL_SETTINGS.menu_contact_on)),
    menu_news_on: boolToStr(boolValue(input.menu_news_on, INITIAL_SETTINGS.menu_news_on)),
    blog_show: boolToStr(boolValue(input.blog_show, INITIAL_SETTINGS.blog_show)),
    site_theme_color: input.site_theme_color || INITIAL_SETTINGS.site_theme_color,
    site_theme_mode: input.site_theme_mode === "dark" ? "dark" : "light",
    default_class_name: sanitizeStr(input.default_class_name, INITIAL_SETTINGS.default_class_name),
    home_sections: normalizeHomeSections(input.home_sections),
    hero_title: sanitizeStr(input.hero_title),
    hero_subtitle: sanitizeStr(input.hero_subtitle),
    hero_logo_url: sanitizeStr(input.hero_logo_url),
    teachers_intro: sanitizeStr(input.teachers_intro),
    teachers_list: sanitizeStr(input.teachers_list),
    about_md: sanitizeStr(input.about_md),
    academy_name: sanitizeStr(input.academy_name),
    principal_name: sanitizeStr(input.principal_name),
    academy_address: sanitizeStr(input.academy_address),
    academy_phone: sanitizeStr(input.academy_phone),
    academy_email: sanitizeStr(input.academy_email),
    founded_year: sanitizeStr(input.founded_year),
    academy_description: sanitizeStr(input.academy_description),
    header_logo: sanitizeStr(input.header_logo),
    favicon: sanitizeStr(input.favicon),
    loading_logo: sanitizeStr(input.loading_logo),
    primary_color: sanitizeStr(input.primary_color, INITIAL_SETTINGS.primary_color),
    secondary_color: sanitizeStr(input.secondary_color, INITIAL_SETTINGS.secondary_color),
    accent_color: sanitizeStr(input.accent_color, INITIAL_SETTINGS.accent_color),
    title_font: sanitizeStr(input.title_font, INITIAL_SETTINGS.title_font),
    body_font: sanitizeStr(input.body_font, INITIAL_SETTINGS.body_font),
  };
}

function buildPayload(state) {
  const normalizedSections = normalizeHomeSections(state.home_sections);
  return {
    menu_home_on: state.menu_home_on === "true",
    menu_blog_on: state.menu_blog_on === "true",
    menu_materials_on: state.menu_materials_on === "true",
    menu_contact_on: state.menu_contact_on === "true",
    menu_news_on: state.menu_news_on === "true",
    blog_show: state.blog_show === "true",
    site_theme_color: sanitizeStr(state.site_theme_color, INITIAL_SETTINGS.site_theme_color),
    site_theme_mode: state.site_theme_mode === "dark" ? "dark" : "light",
    default_class_name: sanitizeStr(state.default_class_name, INITIAL_SETTINGS.default_class_name),
    home_sections: normalizedSections,
    hero_title: sanitizeStr(state.hero_title),
    hero_subtitle: sanitizeStr(state.hero_subtitle),
    hero_logo_url: sanitizeStr(state.hero_logo_url),
    teachers_intro: sanitizeStr(state.teachers_intro),
    teachers_list: sanitizeStr(state.teachers_list),
    about_md: sanitizeStr(state.about_md),
    academy_name: sanitizeStr(state.academy_name),
    principal_name: sanitizeStr(state.principal_name),
    academy_address: sanitizeStr(state.academy_address),
    academy_phone: sanitizeStr(state.academy_phone),
    academy_email: sanitizeStr(state.academy_email),
    founded_year: sanitizeStr(state.founded_year),
    academy_description: sanitizeStr(state.academy_description),
    header_logo: sanitizeStr(state.header_logo),
    favicon: sanitizeStr(state.favicon),
    loading_logo: sanitizeStr(state.loading_logo),
    primary_color: sanitizeStr(state.primary_color, INITIAL_SETTINGS.primary_color),
    secondary_color: sanitizeStr(state.secondary_color, INITIAL_SETTINGS.secondary_color),
    accent_color: sanitizeStr(state.accent_color, INITIAL_SETTINGS.accent_color),
    title_font: sanitizeStr(state.title_font, INITIAL_SETTINGS.title_font),
    body_font: sanitizeStr(state.body_font, INITIAL_SETTINGS.body_font),
  };
}

export default function SuperSettings() {
  const [role, setRole] = useState("");
  const [loadingMe, setLoadingMe] = useState(true);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const logoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        const data = await getSiteSettings();
        const rawSettings = data?.settings ?? data;
        setSettings(toStateShape(rawSettings));
      } catch (e) {
        setErr("설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadingMe, role]);

  const homeSections = useMemo(() => normalizeHomeSections(settings.home_sections), [settings.home_sections]);

  const currentPresetKey = useMemo(() => {
    const match = THEME_PRESETS.find(
      (preset) =>
        preset.siteThemeColor === settings.site_theme_color &&
        preset.siteThemeMode === settings.site_theme_mode &&
        preset.primary === settings.primary_color &&
        preset.secondary === settings.secondary_color &&
        preset.accent === settings.accent_color
    );
    return match?.key || null;
  }, [
    settings.site_theme_color,
    settings.site_theme_mode,
    settings.primary_color,
    settings.secondary_color,
    settings.accent_color,
  ]);

  useEffect(() => {
    applyTheme({ site_theme_color: settings.site_theme_color, site_theme_mode: settings.site_theme_mode });
  }, [settings.site_theme_color, settings.site_theme_mode]);

  if (loadingMe)
    return (
      <PageWrap>
        <CenterText>권한 확인 중입니다…</CenterText>
      </PageWrap>
    );
  if (role !== "super")
    return (
      <PageWrap>
        <CenterText>접근 권한이 필요합니다. (슈퍼 전용)</CenterText>
      </PageWrap>
    );

  const onChange = (k, v) => setSettings((prev) => ({ ...prev, [k]: v }));

  const handleThemePresetSelect = (presetKey) => {
    const preset = THEME_PRESETS.find((item) => item.key === presetKey);
    if (!preset) return;
    setSettings((prev) =>
      toStateShape({
        ...prev,
        site_theme_color: preset.siteThemeColor,
        site_theme_mode: preset.siteThemeMode,
        primary_color: preset.primary,
        secondary_color: preset.secondary,
        accent_color: preset.accent,
      })
    );
  };

  const toggleHomeSection = (sectionKey, enabled) => {
    setSettings((prev) => ({
      ...prev,
      home_sections: normalizeHomeSections(prev.home_sections).map((item) =>
        item.key === sectionKey ? { ...item, on: enabled } : item
      ),
    }));
  };

  const triggerLogoUpload = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const onLogoFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const token = getToken?.();
    if (!token) {
      setErr("인증이 필요합니다. 다시 로그인해 주세요.");
      setTimeout(() => setErr(""), 2500);
      if (event.target) event.target.value = "";
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "hero");

      const response = await fetch(`${API_URL}/api/theme/upload/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.message || "로고 업로드에 실패했습니다.";
        throw new Error(message);
      }

      const url = payload?.url;
      if (!url) {
        throw new Error("업로드 응답에서 URL을 찾을 수 없습니다.");
      }

      setSettings((prev) => ({ ...prev, hero_logo_url: url }));
      setMsg("로고가 업로드되었습니다. 저장을 눌러 적용하세요.");
      setTimeout(() => setMsg(""), 2000);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[SuperSettings] hero logo upload failed", error);
      }
      setErr(error?.message || "로고 업로드에 실패했습니다.");
      setTimeout(() => setErr(""), 3000);
    } finally {
      setUploadingLogo(false);
      if (event.target) event.target.value = "";
    }
  };


  const save = async () => {
    try {
      setSaving(true);
      setMsg("");
      setErr("");

      const payload = buildPayload(settings);

      const result = await saveSiteSettings(payload);
      const latest = result?.settings ?? payload;
      setSettings(toStateShape(latest));
      persistThemeSnapshot(latest);
      applyTheme({ site_theme_color: latest.site_theme_color, site_theme_mode: latest.site_theme_mode });
      emitSiteSettingsUpdated();
      setMsg("저장되었습니다.");
      setTimeout(() => setMsg(""), 1800);
    } catch (e) {
      setErr("저장에 실패했습니다. 다시 시도해 주세요.");
      setTimeout(() => setErr(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrap>
      <Header>
        <h2 style={{ margin: 0, fontSize: 20 }}>공개 사이트 설정 (슈퍼)</h2>
        <div>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </Header>

      {msg && <Alert ok>{msg}</Alert>}
      {err && <Alert>{err}</Alert>}

      {loading ? (
        <Panel>
          <CenterText>불러오는 중입니다…</CenterText>
        </Panel>
      ) : (
        <>
          <Panel>
            <SectionTitle>메뉴 노출</SectionTitle>
            <Note>체크된 메뉴만 공개 사이트 상단 네비게이션에 노출됩니다.</Note>
            <Row>
              <Switch
                label="홈"
                value={settings.menu_home_on}
                onChange={(v) => onChange("menu_home_on", v)}
              />
              <Switch
                label="공지사항"
                value={settings.menu_news_on}
                onChange={(v) => onChange("menu_news_on", v)}
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
            <SectionTitle>테마 & 색상</SectionTitle>
            <Note>원하는 분위기의 테마를 선택하면 아래 색상값이 자동으로 채워집니다. 세부 색상은 선택 후 수정할 수 있습니다.</Note>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {THEME_PRESETS.map((preset) => {
                  const active = preset.key === currentPresetKey;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleThemePresetSelect(preset.key)}
                      style={{
                        textAlign: "left",
                        border: active ? "2px solid #226ad6" : "1px solid #d8deea",
                        borderRadius: 12,
                        padding: 12,
                        background: "#fff",
                        cursor: "pointer",
                        boxShadow: active ? "0 4px 12px rgba(34,106,214,0.18)" : "none",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{preset.label}</div>
                      <div style={{ fontSize: 13, color: "#5b6474", marginBottom: 10 }}>{preset.description}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[preset.primary, preset.secondary, preset.accent].map((color) => (
                          <div
                            key={color}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              border: "1px solid #e0e5ef",
                              background: color,
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Row>
                <Field label="메인 색상">
                  <input
                    type="color"
                    value={settings.site_theme_color || "#2d4373"}
                    onChange={(e) => onChange("site_theme_color", e.target.value)}
                    style={colorInput}
                  />
                  <input
                    type="text"
                    value={settings.site_theme_color || ""}
                    onChange={(e) => onChange("site_theme_color", e.target.value)}
                    style={inp}
                  />
                </Field>
                <Field label="테마 모드">
                  <label style={{ marginRight: 10 }}>
                    <input
                      type="radio"
                      name="theme_mode"
                      checked={settings.site_theme_mode === "light"}
                      onChange={() => onChange("site_theme_mode", "light")}
                    />
                    {" "}Light
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="theme_mode"
                      checked={settings.site_theme_mode === "dark"}
                      onChange={() => onChange("site_theme_mode", "dark")}
                    />
                    {" "}Dark
                  </label>
                </Field>
              </Row>

              <Row>
                <Field label="Primary">
                  <input
                    type="color"
                    value={settings.primary_color || "#2d4373"}
                    onChange={(e) => onChange("primary_color", e.target.value)}
                    style={colorInput}
                  />
                  <input
                    type="text"
                    value={settings.primary_color || ""}
                    onChange={(e) => onChange("primary_color", e.target.value)}
                    style={inp}
                  />
                </Field>
                <Field label="Secondary">
                  <input
                    type="color"
                    value={settings.secondary_color || "#f8faff"}
                    onChange={(e) => onChange("secondary_color", e.target.value)}
                    style={colorInput}
                  />
                  <input
                    type="text"
                    value={settings.secondary_color || ""}
                    onChange={(e) => onChange("secondary_color", e.target.value)}
                    style={inp}
                  />
                </Field>
                <Field label="Accent">
                  <input
                    type="color"
                    value={settings.accent_color || "#226ad6"}
                    onChange={(e) => onChange("accent_color", e.target.value)}
                    style={colorInput}
                  />
                  <input
                    type="text"
                    value={settings.accent_color || ""}
                    onChange={(e) => onChange("accent_color", e.target.value)}
                    style={inp}
                  />
                </Field>
              </Row>
            </div>
          </Panel>

          <Panel>
            <SectionTitle>홈 섹션 표시</SectionTitle>
            <Note>홈페이지에 보여줄 기본 섹션을 선택하세요. 비활성화하면 해당 영역이 숨겨집니다.</Note>
            <div style={{ display: "grid", gap: 10 }}>
              {homeSections.map((section) => {
                const meta = HOME_SECTION_CHOICES.find((item) => item.key === section.key);
                if (!meta) return null;
                return (
                  <label
                    key={section.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #e5e9f2",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "#fff",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#1f2a40" }}>{meta.label}</div>
                      <div style={{ fontSize: 12, color: "#6a7284" }}>{meta.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={section.on}
                      onChange={(e) => toggleHomeSection(section.key, e.target.checked)}
                    />
                  </label>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <SectionTitle>홈 섹션 콘텐츠</SectionTitle>
            <Note>메인 페이지에 보여줄 대표 문구를 직접 입력할 수 있습니다.</Note>

            {/* 히어로 섹션 */}
            <ContentSection title="?? 히어로 섹션" description="메인 페이지 상단 첫인상 영역">
              <Row>
                <Field label="히어로 제목">
                  <input
                    type="text"
                    value={settings.hero_title || ""}
                    onChange={(e) => onChange("hero_title", e.target.value)}
                    style={inp}
                    placeholder="예) IG 수학학원"
                  />
                </Field>
                <Field label="히어로 로고 URL">
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="text"
                      value={settings.hero_logo_url || ""}
                      onChange={(e) => onChange("hero_logo_url", e.target.value)}
                      style={{ ...inp, flex: "1 1 260px" }}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={triggerLogoUpload}
                      disabled={uploadingLogo}
                      style={{ ...btnPrimary, padding: "8px 12px", background: "#475569" }}
                    >
                      {uploadingLogo ? "업로드 중..." : "파일 업로드"}
                    </button>
                  </div>
                  {settings.hero_logo_url && (
                    <div style={{ marginTop: 10 }}>
                      <img
                        src={settings.hero_logo_url}
                        alt="업로드된 로고 미리보기"
                        style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 12, border: "1px solid #e2e8f0" }}
                      />
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onLogoFileChange}
                  />
                </Field>
              </Row>
              <FullWidthField label="히어로 부제목">
                <textarea
                  value={settings.hero_subtitle || ""}
                  onChange={(e) => onChange("hero_subtitle", e.target.value)}
                  style={{ ...textarea, minHeight: 80 }}
                  rows={3}
                  placeholder="학원의 핵심 메시지를 입력하세요. 예) '체계적인 수학 교육으로 꿈을 실현하세요'"
                />
              </FullWidthField>
            </ContentSection>

            {/* 학원 소개 섹션 */}
            <ContentSection title="?? 학원 소개" description="About 섹션에 표시될 내용">
              <FullWidthField label="학원 소개 문구">
                <textarea
                  value={settings.about_md || ""}
                  onChange={(e) => onChange("about_md", e.target.value)}
                  style={{ ...textarea, minHeight: 120 }}
                  rows={6}
                  placeholder={`메인 페이지 소개 영역에 보여줄 내용을 입력하세요.

예시:
저희 IG 수학학원은 20년간의 교육 경험을 바탕으로
학생 개개인의 수준에 맞는 맞춤형 수학 교육을 제공합니다.
체계적인 커리큘럼과 검증된 교수법으로 학생들의 실력 향상을 돕겠습니다.`}
                />
              </FullWidthField>
            </ContentSection>

            {/* 강사진 섹션 */}
            <ContentSection title="????? 강사진" description="강사진 섹션에 표시될 내용">
              <FullWidthField label="강사진 소개 문구">
                <textarea
                  value={settings.teachers_intro || ""}
                  onChange={(e) => onChange("teachers_intro", e.target.value)}
                  style={{ ...textarea, minHeight: 80 }}
                  rows={4}
                  placeholder={`강사진 섹션 상단에 보여줄 소개 문구를 입력하세요.

예시: 풍부한 경험과 전문성을 갖춘 최고의 강사진이 학생들의 수학 실력 향상을 책임집니다.`}
                />
              </FullWidthField>
              <FullWidthField label="강사진 목록">
                <textarea
                  value={settings.teachers_list || ""}
                  onChange={(e) => onChange("teachers_list", e.target.value)}
                  style={{ ...textarea, minHeight: 150 }}
                  rows={10}
                  placeholder={`강사진 정보를 입력하세요. 한 줄에 한 명씩 작성해주세요.

예시:
김수학 원장 - 서울대 수학교육과 졸업, 20년 경력 - 고등수학, 미적분
이미적 강사 - 연세대 수학과 졸업, 15년 경력 - 중등수학, 기하
박통계 강사 - 고려대 통계학과 졸업, 10년 경력 - 확률과 통계`}
                />
              </FullWidthField>
            </ContentSection>
          </Panel>


          <Panel>
            <SectionTitle>브랜딩 & 기본 정보</SectionTitle>
            <Note>학원명, 연락처 등 홈페이지 전반에 노출되는 정보를 입력합니다.</Note>
            <Row>
              <Field label="학원명">
                <input
                  type="text"
                  value={settings.academy_name || ""}
                  onChange={(e) => onChange("academy_name", e.target.value)}
                  style={inp}
                  placeholder="예) IG수학 학원"
                />
              </Field>
              <Field label="원장명">
                <input
                  type="text"
                  value={settings.principal_name || ""}
                  onChange={(e) => onChange("principal_name", e.target.value)}
                  style={inp}
                />
              </Field>
            </Row>
            <Row>
              <Field label="주소">
                <input
                  type="text"
                  value={settings.academy_address || ""}
                  onChange={(e) => onChange("academy_address", e.target.value)}
                  style={inp}
                />
              </Field>
              <Field label="대표 전화">
                <input
                  type="text"
                  value={settings.academy_phone || ""}
                  onChange={(e) => onChange("academy_phone", e.target.value)}
                  style={inp}
                />
              </Field>
            </Row>
            <Row>
              <Field label="대표 이메일">
                <input
                  type="email"
                  value={settings.academy_email || ""}
                  onChange={(e) => onChange("academy_email", e.target.value)}
                  style={inp}
                />
              </Field>
              <Field label="설립 연도">
                <input
                  type="text"
                  value={settings.founded_year || ""}
                  onChange={(e) => onChange("founded_year", e.target.value)}
                  style={inp}
                  placeholder="예) 2020"
                />
              </Field>
            </Row>
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
    <div style={{ minWidth: 220 }}>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

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
  <div style={{ marginTop: 12, color: ok ? "#1b7b1b" : "#b71818", fontWeight: 700 }}>{children}</div>
);

const Row = ({ children }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>{children}</div>
);

const Note = ({ children }) => (
  <p style={{ fontSize: 13, color: "#657089", margin: "0 0 14px 0" }}>{children}</p>
);

const btnPrimary = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 10,
  background: "#226ad6",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const inp = { padding: "8px 10px", border: "1px solid #cfd5e2", borderRadius: 8, minWidth: 180 };
const textarea = { ...inp, minHeight: 90, width: "100%", resize: "vertical" };
const colorInput = { width: 50, height: 30, border: "none", background: "transparent", cursor: "pointer" };

// 새로운 UI 컴포넌트들
const ContentSection = ({ title, description, children }) => (
  <div style={{
    background: "#fafbfc",
    border: "1px solid #e8ecf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    }}>
      <h3 style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: "#1f2937"
      }}>
        {title}
      </h3>
    </div>
    {description && (
      <p style={{
        margin: "0 0 16px 0",
        fontSize: 13,
        color: "#6b7280"
      }}>
        {description}
      </p>
    )}
    <div style={{ display: "grid", gap: 12 }}>
      {children}
    </div>
  </div>
);

const FullWidthField = ({ label, children }) => (
  <div style={{ width: "100%" }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
      {label}
    </div>
    {children}
  </div>
);
