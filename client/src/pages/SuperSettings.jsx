// client/src/pages/SuperSettings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../api";
import { getToken, clearAuth } from "../utils/auth";
import { getSiteSettings, saveSiteSettings } from "../utils/superApi";
import { emitSiteSettingsUpdated, persistThemeSnapshot, applyTheme } from "../utils/sitePublic";

/** ���� �����ڿ� ���� ����Ʈ ���� ������ */

const INITIAL_SETTINGS = {
  menu_home_on: "true",
  menu_blog_on: "true",
  menu_materials_on: "true",
  menu_contact_on: "true",
  menu_news_on: "true",
  blog_show: "true",
  site_theme_color: "#2d4373",
  site_theme_mode: "light",
  default_class_name: "IG����",
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
    description: "������ ���̺�� ���� ȸ�� ����",
    siteThemeColor: "#2d4373",
    siteThemeMode: "light",
    primary: "#2d4373",
    secondary: "#f5f7fb",
    accent: "#226ad6",
  },
  {
    key: "emerald-fresh",
    label: "Emerald Fresh",
    description: "����� ���޶���� �̻�",
    siteThemeColor: "#1f8a70",
    siteThemeMode: "light",
    primary: "#1f8a70",
    secondary: "#f4fbf7",
    accent: "#2fbf71",
  },
  {
    key: "sunrise",
    label: "Sunrise Warm",
    description: "������ ������ ����Ʈ",
    siteThemeColor: "#e07a3f",
    siteThemeMode: "light",
    primary: "#e07a3f",
    secondary: "#fff7f0",
    accent: "#f0a35e",
  },
  {
    key: "slate-minimal",
    label: "Slate Minimal",
    description: "����� ������Ʈ ��",
    siteThemeColor: "#465870",
    siteThemeMode: "light",
    primary: "#465870",
    secondary: "#f1f4f8",
    accent: "#7688a3",
  },
  {
    key: "midnight",
    label: "Midnight Focus",
    description: "��ο� ��濡 ������ ����Ʈ",
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
  { key: "hero", label: "���� �����", description: "ù ȭ�� ��� �Ұ� ���" },
  { key: "about", label: "�п� �Ұ�", description: "���� �λ縻 / �п� �Ұ� ����" },
  { key: "schedule", label: "��ġ �ȳ�", description: "���� �� ����ó ���" },
  { key: "teachers", label: "������ �Ұ�", description: "��ǥ ���� �Ұ� ����" },
  { key: "blog", label: "��α� �ֽű�", description: "��α� �ֽ� �Խù� �Ұ�" },
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
        const { settings: s } = await getSiteSettings();
        setSettings(toStateShape(s));
      } catch (e) {
        setErr("������ �ҷ����� ���߽��ϴ�.");
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

  if (loadingMe)
    return (
      <PageWrap>
        <CenterText>���� Ȯ�� ���Դϴ١�</CenterText>
      </PageWrap>
    );
  if (role !== "super")
    return (
      <PageWrap>
        <CenterText>���� ������ �ʿ��մϴ�. (���� ����)</CenterText>
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
      setErr("������ �ʿ��մϴ�. �ٽ� �α����� �ּ���.");
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
        const message = payload?.message || "�ΰ� ���ε忡 �����߽��ϴ�.";
        throw new Error(message);
      }

      const url = payload?.url;
      if (!url) {
        throw new Error("���ε� ���信�� URL�� ã�� �� �����ϴ�.");
      }

      setSettings((prev) => ({ ...prev, hero_logo_url: url }));
      setMsg("�ΰ� ���ε�Ǿ����ϴ�. ������ ���� �����ϼ���.");
      setTimeout(() => setMsg(""), 2000);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[SuperSettings] hero logo upload failed", error);
      }
      setErr(error?.message || "�ΰ� ���ε忡 �����߽��ϴ�.");
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

      await saveSiteSettings(payload);
      setSettings((prev) => toStateShape({ ...prev, ...payload }));
      persistThemeSnapshot(payload);
      applyTheme({ site_theme_color: payload.site_theme_color, site_theme_mode: payload.site_theme_mode });
      emitSiteSettingsUpdated();
      setMsg("����Ǿ����ϴ�.");
      setTimeout(() => setMsg(""), 1800);
    } catch (e) {
      setErr("���忡 �����߽��ϴ�. �ٽ� �õ��� �ּ���.");
      setTimeout(() => setErr(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrap>
      <Header>
        <h2 style={{ margin: 0, fontSize: 20 }}>���� ����Ʈ ���� (����)</h2>
        <div>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "���� �ߡ�" : "����"}
          </button>
        </div>
      </Header>

      {msg && <Alert ok>{msg}</Alert>}
      {err && <Alert>{err}</Alert>}

      {loading ? (
        <Panel>
          <CenterText>�ҷ����� ���Դϴ١�</CenterText>
        </Panel>
      ) : (
        <>
          <Panel>
            <SectionTitle>�޴� ����</SectionTitle>
            <Note>üũ�� �޴��� ���� ����Ʈ ��� �׺���̼ǿ� ����˴ϴ�.</Note>
            <Row>
              <Switch
                label="Ȩ"
                value={settings.menu_home_on}
                onChange={(v) => onChange("menu_home_on", v)}
              />
              <Switch
                label="��������"
                value={settings.menu_news_on}
                onChange={(v) => onChange("menu_news_on", v)}
              />
              <Switch
                label="��α�"
                value={settings.menu_blog_on}
                onChange={(v) => onChange("menu_blog_on", v)}
              />
              <Switch
                label="�ڷ��"
                value={settings.menu_materials_on}
                onChange={(v) => onChange("menu_materials_on", v)}
              />
              <Switch
                label="��㹮��"
                value={settings.menu_contact_on}
                onChange={(v) => onChange("menu_contact_on", v)}
              />
            </Row>
          </Panel>

          <Panel>
            <SectionTitle>�׸� & ����</SectionTitle>
            <Note>���ϴ� �������� �׸��� �����ϸ� �Ʒ� ������ �ڵ����� ä�����ϴ�. ���� ������ ���� �� ������ �� �ֽ��ϴ�.</Note>
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
                <Field label="���� ����">
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
                <Field label="�׸� ���">
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
            <SectionTitle>Ȩ ���� ǥ��</SectionTitle>
            <Note>Ȩ�������� ������ �⺻ ������ �����ϼ���. ��Ȱ��ȭ�ϸ� �ش� ������ �������ϴ�.</Note>
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
            <SectionTitle>Ȩ ���� ������</SectionTitle>
            <Note>���� �������� ������ ��ǥ ������ ���� �Է��� �� �ֽ��ϴ�.</Note>

            {/* ����� ���� */}
            <ContentSection title="?? ����� ����" description="���� ������ ��� ù�λ� ����">
              <Row>
                <Field label="����� ����">
                  <input
                    type="text"
                    value={settings.hero_title || ""}
                    onChange={(e) => onChange("hero_title", e.target.value)}
                    style={inp}
                    placeholder="��) IG �����п�"
                  />
                </Field>
                <Field label="����� �ΰ� URL">
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
                      {uploadingLogo ? "���ε� ��..." : "���� ���ε�"}
                    </button>
                  </div>
                  {settings.hero_logo_url && (
                    <div style={{ marginTop: 10 }}>
                      <img
                        src={settings.hero_logo_url}
                        alt="���ε�� �ΰ� �̸�����"
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
              <FullWidthField label="����� ������">
                <textarea
                  value={settings.hero_subtitle || ""}
                  onChange={(e) => onChange("hero_subtitle", e.target.value)}
                  style={{ ...textarea, minHeight: 80 }}
                  rows={3}
                  placeholder="�п��� �ٽ� �޽����� �Է��ϼ���. ��) 'ü������ ���� �������� ���� �����ϼ���'"
                />
              </FullWidthField>
            </ContentSection>

            {/* �п� �Ұ� ���� */}
            <ContentSection title="?? �п� �Ұ�" description="About ���ǿ� ǥ�õ� ����">
              <FullWidthField label="�п� �Ұ� ����">
                <textarea
                  value={settings.about_md || ""}
                  onChange={(e) => onChange("about_md", e.target.value)}
                  style={{ ...textarea, minHeight: 120 }}
                  rows={6}
                  placeholder={`���� ������ �Ұ� ������ ������ ������ �Է��ϼ���.

����:
���� IG �����п��� 20�Ⱓ�� ���� ������ ��������
�л� �������� ���ؿ� �´� ������ ���� ������ �����մϴ�.
ü������ Ŀ��ŧ���� ������ ���������� �л����� �Ƿ� ����� ���ڽ��ϴ�.`}
                />
              </FullWidthField>
            </ContentSection>

            {/* ������ ���� */}
            <ContentSection title="????? ������" description="������ ���ǿ� ǥ�õ� ����">
              <FullWidthField label="������ �Ұ� ����">
                <textarea
                  value={settings.teachers_intro || ""}
                  onChange={(e) => onChange("teachers_intro", e.target.value)}
                  style={{ ...textarea, minHeight: 80 }}
                  rows={4}
                  placeholder={`������ ���� ��ܿ� ������ �Ұ� ������ �Է��ϼ���.

����: ǳ���� ����� �������� ���� �ְ��� �������� �л����� ���� �Ƿ� ����� å�����ϴ�.`}
                />
              </FullWidthField>
              <FullWidthField label="������ ���">
                <textarea
                  value={settings.teachers_list || ""}
                  onChange={(e) => onChange("teachers_list", e.target.value)}
                  style={{ ...textarea, minHeight: 150 }}
                  rows={10}
                  placeholder={`������ ������ �Է��ϼ���. �� �ٿ� �� �� �ۼ����ּ���.

����:
����� ���� - ����� ���б����� ����, 20�� ��� - ������, ������
�̹��� ���� - ������ ���а� ����, 15�� ��� - �ߵ����, ����
����� ���� - ����� ����а� ����, 10�� ��� - Ȯ���� ���`}
                />
              </FullWidthField>
            </ContentSection>
          </Panel>


          <Panel>
            <SectionTitle>�귣�� & �⺻ ����</SectionTitle>
            <Note>�п���, ����ó �� Ȩ������ ���ݿ� ����Ǵ� ������ �Է��մϴ�.</Note>
            <Row>
              <Field label="�п���">
                <input
                  type="text"
                  value={settings.academy_name || ""}
                  onChange={(e) => onChange("academy_name", e.target.value)}
                  style={inp}
                  placeholder="��) IG���� �п�"
                />
              </Field>
              <Field label="�����">
                <input
                  type="text"
                  value={settings.principal_name || ""}
                  onChange={(e) => onChange("principal_name", e.target.value)}
                  style={inp}
                />
              </Field>
            </Row>
            <Row>
              <Field label="�ּ�">
                <input
                  type="text"
                  value={settings.academy_address || ""}
                  onChange={(e) => onChange("academy_address", e.target.value)}
                  style={inp}
                />
              </Field>
              <Field label="��ǥ ��ȭ">
                <input
                  type="text"
                  value={settings.academy_phone || ""}
                  onChange={(e) => onChange("academy_phone", e.target.value)}
                  style={inp}
                />
              </Field>
            </Row>
            <Row>
              <Field label="��ǥ �̸���">
                <input
                  type="email"
                  value={settings.academy_email || ""}
                  onChange={(e) => onChange("academy_email", e.target.value)}
                  style={inp}
                />
              </Field>
              <Field label="���� ����">
                <input
                  type="text"
                  value={settings.founded_year || ""}
                  onChange={(e) => onChange("founded_year", e.target.value)}
                  style={inp}
                  placeholder="��) 2020"
                />
              </Field>
            </Row>
          </Panel>
        </>
      )}
    </PageWrap>
  );
}

/* ---------------- UI ��ƿ ---------------- */
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

// ���ο� UI ������Ʈ��
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






