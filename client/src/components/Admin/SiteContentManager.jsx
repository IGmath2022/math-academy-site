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
    bannerSlides: [],
    aboutSection: {
      title: "학원 소개",
      content: "",
      features: []
    },
    teachers: [],
    gallery: [],
    contactSection: {
      title: "찾아오시는 길",
      mapUrl: "",
      directions: "",
      parkingInfo: "",
      businessHours: ""
    }
  });
  const [teacherAccounts, setTeacherAccounts] = useState([]); // 계정관리의 강사 목록
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

  // 강사 계정 목록 로드
  const loadTeacherAccounts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users/teachers/accounts`, withAuth());
      setTeacherAccounts(data);
    } catch (err) {
      if (handle401(err)) return;
      console.error("강사 계정 목록 로드 실패:", err);
    }
  }, [navigate]);

  useEffect(() => {
    loadContent();
    loadTeacherAccounts();
  }, [loadContent, loadTeacherAccounts]);

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

  // 배너 슬라이드 관리
  const addBannerSlide = () => {
    const newSlides = [...content.bannerSlides, {
      imageUrl: "",
      title: "새 슬라이드",
      subtitle: "",
      buttonText: "자세히 보기",
      buttonUrl: "/",
      order: content.bannerSlides.length,
      visible: true
    }];
    setContent(prev => ({ ...prev, bannerSlides: newSlides }));
  };

  const updateBannerSlide = (index, field, value) => {
    const newSlides = [...content.bannerSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setContent(prev => ({ ...prev, bannerSlides: newSlides }));
  };

  const removeBannerSlide = (index) => {
    const newSlides = content.bannerSlides.filter((_, i) => i !== index);
    setContent(prev => ({ ...prev, bannerSlides: newSlides }));
  };

  // 강사 관리
  const addTeacher = () => {
    const newTeachers = [...content.teachers, {
      userId: null,
      name: "새 강사",
      email: "",
      photo: "",
      position: "",
      education: "",
      experience: "",
      subjects: [],
      order: content.teachers.length,
      visible: true
    }];
    setContent(prev => ({ ...prev, teachers: newTeachers }));
  };

  // 계정관리의 강사를 강사진에 동기화
  const syncTeacherAccount = async (teacherAccountId) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/content/teachers/sync`, { userId: teacherAccountId }, withAuth());
      setMessage("강사 계정이 강사진에 추가되었습니다.");
      await loadContent(); // 콘텐츠 새로고침
    } catch (err) {
      if (handle401(err)) return;
      setError(`강사 동기화 실패: ${err.response?.data?.message || err.message}`);
    }
  };

  const updateTeacher = (index, field, value) => {
    const newTeachers = [...content.teachers];
    newTeachers[index] = { ...newTeachers[index], [field]: value };
    setContent(prev => ({ ...prev, teachers: newTeachers }));
  };

  const removeTeacher = (index) => {
    const newTeachers = content.teachers.filter((_, i) => i !== index);
    setContent(prev => ({ ...prev, teachers: newTeachers }));
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
  const saveBanners = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/content/banners`, { bannerSlides: content.bannerSlides }, withAuth());
      setMessage("배너 슬라이드가 저장되었습니다.");
    } catch (err) {
      if (handle401(err)) return;
      setError(`저장 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveAbout = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/content/about`, { aboutSection: content.aboutSection }, withAuth());
      setMessage("소개 섹션이 저장되었습니다.");
    } catch (err) {
      if (handle401(err)) return;
      setError(`저장 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveTeachers = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/content/teachers`, { teachers: content.teachers }, withAuth());
      setMessage("강사진이 저장되었습니다.");
    } catch (err) {
      if (handle401(err)) return;
      setError(`저장 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

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

      {/* 1. 메인 배너 슬라이드 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
            🎯 메인 배너 슬라이드
          </h3>
          <button
            onClick={addBannerSlide}
            style={{
              ...buttonStyle,
              padding: "8px 16px",
              fontSize: 13,
              background: "#38a169"
            }}
          >
            + 슬라이드 추가
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {content.bannerSlides.map((slide, index) => (
            <div key={index} style={{
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#f8fafc"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => updateBannerSlide(index, 'title', e.target.value)}
                  style={inputStyle}
                  placeholder="슬라이드 제목"
                />
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => updateBannerSlide(index, 'subtitle', e.target.value)}
                  style={inputStyle}
                  placeholder="부제목"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  value={slide.buttonText}
                  onChange={(e) => updateBannerSlide(index, 'buttonText', e.target.value)}
                  style={inputStyle}
                  placeholder="버튼 텍스트"
                />
                <input
                  type="text"
                  value={slide.buttonUrl}
                  onChange={(e) => updateBannerSlide(index, 'buttonUrl', e.target.value)}
                  style={inputStyle}
                  placeholder="버튼 링크"
                />
              </div>

              {slide.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={slide.imageUrl}
                    alt="배너"
                    style={{ maxWidth: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await uploadImage(file, 'banner');
                      if (url) updateBannerSlide(index, 'imageUrl', url);
                    }
                  }}
                  style={{ flex: 1, fontSize: 12 }}
                  disabled={uploading.banner}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={slide.visible}
                    onChange={(e) => updateBannerSlide(index, 'visible', e.target.checked)}
                  />
                  표시
                </label>
                <button
                  onClick={() => removeBannerSlide(index)}
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
            </div>
          ))}
        </div>

        <button
          onClick={saveBanners}
          disabled={saving}
          style={{
            ...buttonStyle,
            marginTop: 16,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "저장 중..." : "배너 저장"}
        </button>
      </div>

      {/* 2. 학원 소개 섹션 */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
          📝 학원 소개
        </h3>

        <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
              섹션 제목
            </label>
            <input
              type="text"
              value={content.aboutSection.title}
              onChange={(e) => setContent(prev => ({
                ...prev,
                aboutSection: { ...prev.aboutSection, title: e.target.value }
              }))}
              style={inputStyle}
              placeholder="학원 소개"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#4a5568" }}>
              소개 내용
            </label>
            <textarea
              value={content.aboutSection.content}
              onChange={(e) => setContent(prev => ({
                ...prev,
                aboutSection: { ...prev.aboutSection, content: e.target.value }
              }))}
              style={textareaStyle}
              placeholder="학원에 대한 상세한 소개를 작성해주세요..."
            />
          </div>
        </div>

        <button
          onClick={saveAbout}
          disabled={saving}
          style={{
            ...buttonStyle,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "저장 중..." : "소개 섹션 저장"}
        </button>
      </div>

      {/* 3. 강사진 관리 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
            👨‍🏫 강사진 관리
          </h3>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={addTeacher}
              style={{
                ...buttonStyle,
                padding: "8px 16px",
                fontSize: 13,
                background: "#38a169"
              }}
            >
              + 강사 추가
            </button>
          </div>
        </div>

        {/* 계정관리의 강사 목록 */}
        {teacherAccounts.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#2d3748" }}>
              📋 계정관리의 강사들
            </h4>
            <div style={{ display: "grid", gap: 8 }}>
              {teacherAccounts.map(account => {
                const isAlreadySynced = content.teachers.some(t => t.userId === account._id);
                return (
                  <div key={account._id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0"
                  }}>
                    <div>
                      <strong>{account.name}</strong> ({account.email})
                      {isAlreadySynced && <span style={{ color: "#38a169", fontSize: 12, marginLeft: 8 }}>✓ 연동됨</span>}
                    </div>
                    {!isAlreadySynced && (
                      <button
                        onClick={() => syncTeacherAccount(account._id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #3182ce",
                          background: "#ebf8ff",
                          color: "#3182ce",
                          fontSize: 12,
                          cursor: "pointer"
                        }}
                      >
                        강사진에 추가
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          {content.teachers.map((teacher, index) => (
            <div key={index} style={{
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#f8fafc"
            }}>
              {/* 계정 연동 상태 표시 */}
              {teacher.userId && (
                <div style={{
                  padding: "8px 12px",
                  marginBottom: 12,
                  background: "#e6fffa",
                  border: "1px solid #38d9a9",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#00875a"
                }}>
                  <strong>🔗 계정 연동됨</strong> - {teacher.email}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  value={teacher.name}
                  onChange={(e) => updateTeacher(index, 'name', e.target.value)}
                  style={inputStyle}
                  placeholder="강사 이름"
                  disabled={!!teacher.userId} // 연동된 계정은 이름 수정 불가
                />
                <input
                  type="text"
                  value={teacher.position}
                  onChange={(e) => updateTeacher(index, 'position', e.target.value)}
                  style={inputStyle}
                  placeholder="직책"
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <textarea
                  value={teacher.education}
                  onChange={(e) => updateTeacher(index, 'education', e.target.value)}
                  style={{ ...textareaStyle, minHeight: 80 }}
                  placeholder="학력 및 경력"
                />
              </div>

              {teacher.photo && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={teacher.photo}
                    alt="강사 사진"
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await uploadImage(file, 'teacher');
                      if (url) updateTeacher(index, 'photo', url);
                    }
                  }}
                  style={{ flex: 1, fontSize: 12 }}
                  disabled={uploading.teacher}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={teacher.visible}
                    onChange={(e) => updateTeacher(index, 'visible', e.target.checked)}
                  />
                  표시
                </label>
                <button
                  onClick={() => removeTeacher(index)}
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
            </div>
          ))}
        </div>

        <button
          onClick={saveTeachers}
          disabled={saving}
          style={{
            ...buttonStyle,
            marginTop: 16,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "저장 중..." : "강사진 저장"}
        </button>
      </div>

      {/* 4. 갤러리 관리 */}
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