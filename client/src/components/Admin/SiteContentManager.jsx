// client/src/components/Admin/SiteContentManager.jsx
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

const textareaStyle = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
  fontFamily: "inherit",
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

export default function SiteContentManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({
    gallery: [],
    contactSection: {
      title: "찾아오시는 길",
      mapUrl: "",
      directions: "",
      parkingInfo: "",
      businessHours: ""
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

  // 콘텐츠 로드
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_URL}/api/content`);
      setContent(data);
    } catch (err) {
      if (handle401(err)) return;
      setError("콘텐츠를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);


  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // 이미지 업로드
  const uploadImage = async (file, type, category = null) => {
    const uploadKey = category ? `${type}_${category}` : type;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);

      let uploadUrl = '';
      switch (type) {
        case 'banner':
          uploadUrl = '/api/banner/upload';
          break;
        case 'teacher':
          uploadUrl = '/api/theme/upload/teacher';
          break;
        case 'gallery':
          uploadUrl = '/api/theme/upload/gallery';
          break;
        default:
          uploadUrl = '/api/banner/upload';
      }

      const { data } = await axios.post(`${API_URL}${uploadUrl}`, formData, {
        ...withAuth(),
        headers: {
          ...withAuth().headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(`이미지가 업로드되었습니다.`);
      return data.url;
    } catch (err) {
      if (handle401(err)) return;
      setError(`이미지 업로드 실패: ${err.response?.data?.message || err.message}`);
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };



  // 갤러리 관리
  const addGalleryItem = () => {
    const newGallery = [...content.gallery, {
      imageUrl: "",
      title: "",
      description: "",
      category: "general",
      order: content.gallery.length,
      visible: true
    }];
    setContent(prev => ({ ...prev, gallery: newGallery }));
  };

  const updateGalleryItem = (index, field, value) => {
    const newGallery = [...content.gallery];
    newGallery[index] = { ...newGallery[index], [field]: value };
    setContent(prev => ({ ...prev, gallery: newGallery }));
  };

  const removeGalleryItem = (index) => {
    const newGallery = content.gallery.filter((_, i) => i !== index);
    setContent(prev => ({ ...prev, gallery: newGallery }));
  };

  // 저장 함수들

  const saveGallery = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/content/gallery`, { gallery: content.gallery }, withAuth());
      setMessage("갤러리가 저장되었습니다.");
    } catch (err) {
      if (handle401(err)) return;
      setError(`저장 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40 }}>콘텐츠를 불러오는 중...</div>;
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

      {/* 갤러리 관리 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
            🖼️ 갤러리 관리
          </h3>
          <button
            onClick={addGalleryItem}
            style={{
              ...buttonStyle,
              padding: "8px 16px",
              fontSize: 13,
              background: "#38a169"
            }}
          >
            + 이미지 추가
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {content.gallery.map((item, index) => (
            <div key={index} style={{
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#f8fafc"
            }}>
              {item.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={item.imageUrl}
                    alt="갤러리"
                    style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateGalleryItem(index, 'title', e.target.value)}
                  style={inputStyle}
                  placeholder="이미지 제목"
                />
                <select
                  value={item.category}
                  onChange={(e) => updateGalleryItem(index, 'category', e.target.value)}
                  style={inputStyle}
                >
                  <option value="general">일반</option>
                  <option value="facility">시설</option>
                  <option value="class">수업</option>
                  <option value="event">행사</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await uploadImage(file, 'gallery', item.category);
                      if (url) updateGalleryItem(index, 'imageUrl', url);
                    }
                  }}
                  style={{ flex: 1, fontSize: 11 }}
                  disabled={uploading[`gallery_${item.category}`]}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={(e) => updateGalleryItem(index, 'visible', e.target.checked)}
                  />
                  표시
                </label>
                <button
                  onClick={() => removeGalleryItem(index)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #e53e3e",
                    background: "#fff5f5",
                    color: "#c53030",
                    fontSize: 11,
                    cursor: "pointer"
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveGallery}
          disabled={saving}
          style={{
            ...buttonStyle,
            marginTop: 16,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "저장 중..." : "갤러리 저장"}
        </button>
      </div>
    </div>
  );
}