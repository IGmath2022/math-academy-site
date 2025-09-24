// client/src/components/Admin/SiteThemeManager.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { getToken, clearAuth } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d8deea",
  borderRadius: 12,
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
};

const buttonStyle = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#2d4373",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e8edf3",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 4px 12px rgba(25, 35, 60, 0.04)",
};

export default function SiteThemeManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    branding: {
      academyName: "",
      principalName: "",
      address: "",
      phone: "",
      email: "",
      foundedYear: 2020,
      description: "",
      headerLogo: "",
      favicon: "",
      loadingLogo: "",
      primaryColor: "#2d4373",
      secondaryColor: "#f8faff",
      accentColor: "#226ad6",
      titleFont: "Noto Sans KR",
      bodyFont: "Noto Sans KR"
    },
    layout: {
      mainSections: ["banner", "about", "teachers", "notice", "gallery", "contact"],
      navigation: [],
      sidebar: {
        showRecentNotice: true,
        showContact: true,
        showEnrollButton: false,
        showConsultButton: false
      }
    }
  });
  const [uploading, setUploading] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate("/login");
      return true;
    }
    return false;
  };

  // 설정 로드
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_URL}/api/site/settings`, withAuth());
      setSettings(data);
    } catch (err) {
      if (handle401(err)) return;
      setError("설정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 브랜딩 정보 업데이트
  const updateBranding = (field, value) => {
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: value }
    }));
  };

  // 레이아웃 업데이트
  const updateLayout = (field, value) => {
    setSettings(prev => ({
      ...prev,
      layout: { ...prev.layout, [field]: value }
    }));
  };

  // 로고 업로드
  const uploadLogo = async (file, type) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const { data } = await axios.post(`${API_URL}/api/theme/upload/logo`, formData, {
        ...withAuth(),
        headers: {
          ...withAuth().headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      updateBranding(type === 'header' ? 'headerLogo' : type === 'favicon' ? 'favicon' : 'loadingLogo', data.url);
      setMessage(`${type} 로고가 업로드되었습니다.`);
    } catch (err) {
      if (handle401(err)) return;
      setError(`로고 업로드 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // 브랜딩 설정 저장
  const saveBranding = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await axios.put(`${API_URL}/api/site/settings/branding`, settings.branding, withAuth());
      setMessage("브랜딩 설정이 저장되었습니다.");
    } catch (err) {
      if (handle401(err)) return;
      setError(`저장 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 레이아웃 설정 저장
  const saveLayout = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await axios.put(`${API_URL}/api/site/settings/layout`, settings.layout, withAuth());
      setMessage("레이아웃 설정이 저장되었습니다.");
    } catch (err) {
      if (handle401(err)) return;
      setError(`저장 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 네비게이션 메뉴 추가
  const addNavItem = () => {
    const newNav = [...settings.layout.navigation, {
      title: "새 메뉴",
      url: "/new-page",
      order: settings.layout.navigation.length + 1,
      visible: true
    }];
    updateLayout('navigation', newNav);
  };

  // 네비게이션 메뉴 삭제
  const removeNavItem = (index) => {
    const newNav = settings.layout.navigation.filter((_, i) => i !== index);
    updateLayout('navigation', newNav);
  };

  // 네비게이션 메뉴 업데이트
  const updateNavItem = (index, field, value) => {
    const newNav = [...settings.layout.navigation];
    newNav[index] = { ...newNav[index], [field]: value };
    updateLayout('navigation', newNav);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40 }}>설정을 불러오는 중...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* 메시지 표시 */}
      {(message || error) && (
        <div style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: error ? "#fff5f5" : "#f0fff4",
          color: error ? "#c53030" : "#38a169",
          border: `1px solid ${error ? "#fed7d7" : "#c6f6d5"}`,
          fontSize: 14
        }}>
          {error || message}
        </div>
      )}

      {/* 1. 브랜딩 설정 */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
          🎨 브랜딩 설정
        </h3>

        {/* 학원 기본 정보 */}
        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                학원명
              </label>
              <input
                type="text"
                value={settings.branding.academyName}
                onChange={(e) => updateBranding('academyName', e.target.value)}
                style={inputStyle}
                placeholder="예) 수학의 정석 학원"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                원장명
              </label>
              <input
                type="text"
                value={settings.branding.principalName}
                onChange={(e) => updateBranding('principalName', e.target.value)}
                style={inputStyle}
                placeholder="예) 홍길동"
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
              주소
            </label>
            <input
              type="text"
              value={settings.branding.address}
              onChange={(e) => updateBranding('address', e.target.value)}
              style={inputStyle}
              placeholder="예) 서울시 강남구 테헤란로 123"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                전화번호
              </label>
              <input
                type="text"
                value={settings.branding.phone}
                onChange={(e) => updateBranding('phone', e.target.value)}
                style={inputStyle}
                placeholder="예) 02-1234-5678"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                이메일
              </label>
              <input
                type="email"
                value={settings.branding.email}
                onChange={(e) => updateBranding('email', e.target.value)}
                style={inputStyle}
                placeholder="예) info@academy.com"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                설립년도
              </label>
              <input
                type="number"
                value={settings.branding.foundedYear}
                onChange={(e) => updateBranding('foundedYear', parseInt(e.target.value) || 2020)}
                style={inputStyle}
                min="1990"
                max="2030"
              />
            </div>
          </div>
        </div>

        {/* 로고 업로드 */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#2d3748" }}>로고 관리</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {[
              { key: 'header', label: '헤더 로고', field: 'headerLogo' },
              { key: 'favicon', label: '파비콘', field: 'favicon' },
              { key: 'loading', label: '로딩 로고', field: 'loadingLogo' }
            ].map(({ key, label, field }) => (
              <div key={key} style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                  {label}
                </label>
                {settings.branding[field] && (
                  <div style={{ marginBottom: 8 }}>
                    <img
                      src={settings.branding[field]}
                      alt={label}
                      style={{ maxWidth: "100%", maxHeight: 60, objectFit: "contain" }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) uploadLogo(file, key);
                  }}
                  style={{ width: "100%", fontSize: 12 }}
                  disabled={uploading[key]}
                />
                {uploading[key] && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>업로드 중...</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 컬러 테마 */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#2d3748" }}>컬러 테마</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { key: 'primaryColor', label: 'Primary 컬러' },
              { key: 'secondaryColor', label: 'Secondary 컬러' },
              { key: 'accentColor', label: 'Accent 컬러' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
                  {label}
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={settings.branding[key]}
                    onChange={(e) => updateBranding(key, e.target.value)}
                    style={{ width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 8 }}
                  />
                  <input
                    type="text"
                    value={settings.branding[key]}
                    onChange={(e) => updateBranding(key, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="#2d4373"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={saveBranding}
          disabled={saving}
          style={{
            ...buttonStyle,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "저장 중..." : "브랜딩 설정 저장"}
        </button>
      </div>

      {/* 2. 레이아웃 설정 */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
          🎛️ 레이아웃 설정
        </h3>

        {/* 네비게이션 메뉴 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2d3748" }}>네비게이션 메뉴</h4>
            <button
              onClick={addNavItem}
              style={{
                ...buttonStyle,
                padding: "8px 16px",
                fontSize: 13,
                background: "#38a169"
              }}
            >
              + 메뉴 추가
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {settings.layout.navigation.map((nav, index) => (
              <div key={index} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto auto",
                gap: 12,
                alignItems: "center",
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8
              }}>
                <input
                  type="text"
                  value={nav.title}
                  onChange={(e) => updateNavItem(index, 'title', e.target.value)}
                  style={inputStyle}
                  placeholder="메뉴 이름"
                />
                <input
                  type="text"
                  value={nav.url}
                  onChange={(e) => updateNavItem(index, 'url', e.target.value)}
                  style={inputStyle}
                  placeholder="/page-url"
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={nav.visible}
                    onChange={(e) => updateNavItem(index, 'visible', e.target.checked)}
                  />
                  표시
                </label>
                <button
                  onClick={() => removeNavItem(index)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #e53e3e",
                    background: "#fff5f5",
                    color: "#c53030",
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 위젯 */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#2d3748" }}>사이드바 위젯</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { key: 'showRecentNotice', label: '최근 공지사항' },
              { key: 'showContact', label: '학원 연락처' },
              { key: 'showEnrollButton', label: '수강신청 버튼' },
              { key: 'showConsultButton', label: '상담 예약 버튼' }
            ].map(({ key, label }) => (
              <label key={key} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8,
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  checked={settings.layout.sidebar[key]}
                  onChange={(e) => updateLayout('sidebar', {
                    ...settings.layout.sidebar,
                    [key]: e.target.checked
                  })}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={saveLayout}
          disabled={saving}
          style={{
            ...buttonStyle,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "저장 중..." : "레이아웃 설정 저장"}
        </button>
      </div>
    </div>
  );
}