// client/src/components/Admin/TeacherProfileManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '../../api';

const TeacherProfileManager = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // 새 강사 계정 생성 관련 state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const auth = useMemo(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: token ? `Bearer ${token}` : undefined } };
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadTeachers();
    loadSubjects();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users?role=teacher`, auth);
      setTeachers(res.data.filter(user => user.active));
    } catch (error) {
      console.error('강사 목록 로드 실패:', error);
      setMessage('강사 목록을 불러올 수 없습니다.');
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/subjects`, auth);
      setSubjects(res.data);
    } catch (error) {
      console.error('과목 목록 로드 실패:', error);
    }
  };

  const loadProfile = async (teacherId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/teacher-profiles/admin/${teacherId}`, auth);
      setProfile(res.data);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      setMessage('프로필을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    setProfile(null);
    setMessage('');
    loadProfile(teacher._id);
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectChange = (subjectId, checked) => {
    const currentSubjects = profile.subjects || [];
    let newSubjects;

    if (checked) {
      newSubjects = [...currentSubjects, subjectId];
    } else {
      newSubjects = currentSubjects.filter(id => id !== subjectId);
    }

    handleProfileChange('subjects', newSubjects);
  };

  const handleSave = async () => {
    if (!selectedTeacher || !profile) return;

    setSaving(true);
    setMessage('');

    try {
      const updateData = {
        experience: profile.experience || '',
        biography: profile.biography || '',
        subjects: profile.subjects || [],
        displayOrder: parseInt(profile.displayOrder) || 0,
        isPublic: profile.isPublic !== false,
        specialties: profile.specialties || [],
        education: profile.education || '',
        certifications: profile.certifications || []
      };

      const res = await axios.put(
        `${API_URL}/api/teacher-profiles/admin/${selectedTeacher._id}`,
        updateData,
        auth
      );

      setProfile(res.data);
      setMessage('저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      setMessage('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTeacher = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      setMessage('모든 필드를 입력해주세요.');
      return;
    }

    setCreating(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/users`,
        {
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: 'teacher'
        },
        auth
      );

      setMessage('강사 계정이 생성되었습니다.');
      setCreateForm({ name: '', email: '', password: '' });
      setShowCreateForm(false);

      // 강사 목록 새로고침
      await loadTeachers();
    } catch (error) {
      console.error('강사 계정 생성 실패:', error);
      setMessage(error.response?.data?.message || '강사 계정 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post(
        `${API_URL}/api/teacher-profiles/admin/${selectedTeacher._id}/upload-image`,
        formData,
        {
          ...auth,
          headers: {
            ...auth.headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setProfile(prev => ({
        ...prev,
        profileImage: res.data.imageUrl
      }));

      setMessage('이미지 업로드 완료');
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setMessage('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px'
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>강사 프로필 관리</h2>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: message.includes('실패') || message.includes('없습니다') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('실패') || message.includes('없습니다') ? '#fcc' : '#cfc'}`,
          borderRadius: '4px',
          color: message.includes('실패') || message.includes('없습니다') ? '#c00' : '#060'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* 강사 목록 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>강사 목록</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              + 새 강사 추가
            </button>
          </div>

          {/* 강사 계정 생성 폼 */}
          {showCreateForm && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>새 강사 계정 생성</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="이름"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}
                />
                <input
                  type="email"
                  placeholder="이메일"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateTeacher}
                    disabled={creating}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: creating ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {creating ? '생성 중...' : '생성'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' }}>
            {teachers.map(teacher => (
              <div
                key={teacher._id}
                onClick={() => handleTeacherSelect(teacher)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedTeacher?._id === teacher._id ? '#e7f3ff' : 'white',
                  ':hover': { backgroundColor: '#f5f5f5' }
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{teacher.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{teacher.email}</div>
              </div>
            ))}
            {teachers.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                등록된 강사가 없습니다.<br />
                "새 강사 추가" 버튼을 클릭해서 강사를 추가해보세요.
              </div>
            )}
          </div>
        </div>

        {/* 프로필 편집 */}
        <div>
          {!selectedTeacher ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '50px' }}>
              강사를 선택해주세요.
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '50px' }}>
              로딩 중...
            </div>
          ) : profile ? (
            <div>
              <h3 style={{ marginBottom: '20px' }}>{selectedTeacher.name} 프로필</h3>

              {/* 프로필 이미지 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  프로필 이미지
                </label>
                {profile.profileImage && (
                  <div style={{ marginBottom: '10px' }}>
                    <img
                      src={profile.profileImage}
                      alt="프로필"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ marginBottom: '10px' }}
                />
                {uploading && <div style={{ color: '#007bff' }}>업로드 중...</div>}
              </div>

              {/* 기본 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={profile.displayOrder || 0}
                    onChange={(e) => handleProfileChange('displayOrder', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={profile.isPublic !== false}
                      onChange={(e) => handleProfileChange('isPublic', e.target.checked)}
                      style={{ marginRight: '5px' }}
                    />
                    공개 표시
                  </label>
                </div>
              </div>

              {/* 경력 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  경력
                </label>
                <textarea
                  value={profile.experience || ''}
                  onChange={(e) => handleProfileChange('experience', e.target.value)}
                  style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                  placeholder="주요 경력사항을 입력하세요..."
                />
              </div>

              {/* 소개/이력 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  소개 / 이력
                </label>
                <textarea
                  value={profile.biography || ''}
                  onChange={(e) => handleProfileChange('biography', e.target.value)}
                  style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
                  placeholder="강사 소개 및 상세 이력을 입력하세요..."
                />
              </div>

              {/* 학력 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  학력
                </label>
                <input
                  type="text"
                  value={profile.education || ''}
                  onChange={(e) => handleProfileChange('education', e.target.value)}
                  style={inputStyle}
                  placeholder="최종 학력을 입력하세요..."
                />
              </div>

              {/* 담당 과목 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  담당 과목
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {subjects.map(subject => (
                    <label key={subject._id} style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={(profile.subjects || []).includes(subject._id)}
                        onChange={(e) => handleSubjectChange(subject._id, e.target.checked)}
                        style={{ marginRight: '5px' }}
                      />
                      <span style={{ fontSize: '14px' }}>{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 저장 버튼 */}
              <div style={{ textAlign: 'right', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '50px' }}>
              프로필을 불러올 수 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileManager;