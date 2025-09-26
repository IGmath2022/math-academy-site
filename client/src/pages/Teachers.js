// client/src/pages/Teachers.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import { useIsMobile } from '../hooks/useMediaQuery';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/teacher-profiles/public`);
      setTeachers(response.data);
    } catch (err) {
      console.error('강사진 정보 로드 실패:', err);
      setError('강사진 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    paddingBottom: '60px'
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '20px 16px' : '40px 20px'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '30px' : '50px'
  };

  const titleStyle = {
    fontSize: isMobile ? '2rem' : '2.5rem',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '16px'
  };

  const subtitleStyle = {
    fontSize: isMobile ? '1rem' : '1.1rem',
    color: '#64748b',
    lineHeight: '1.6'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: isMobile ? '20px' : '30px',
    marginTop: isMobile ? '20px' : '40px'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: isMobile ? '12px' : '16px',
    padding: isMobile ? '20px' : '30px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  };

  const imageContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  };

  const imageStyle = {
    width: isMobile ? '100px' : '120px',
    height: isMobile ? '100px' : '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  const placeholderImageStyle = {
    width: isMobile ? '100px' : '120px',
    height: isMobile ? '100px' : '120px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '2rem' : '2.5rem',
    color: '#64748b',
    border: '4px solid #f1f5f9'
  };

  const nameStyle = {
    fontSize: isMobile ? '1.3rem' : '1.5rem',
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: '8px'
  };

  const subjectsStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '16px' : '20px'
  };

  const subjectTagStyle = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    padding: isMobile ? '3px 10px' : '4px 12px',
    borderRadius: '16px',
    fontSize: isMobile ? '0.8rem' : '0.85rem',
    fontWeight: '500',
    margin: '0 4px 4px 0'
  };

  const sectionStyle = {
    marginBottom: isMobile ? '12px' : '16px'
  };

  const sectionTitleStyle = {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const sectionContentStyle = {
    fontSize: '0.95rem',
    color: '#64748b',
    lineHeight: '1.6'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
    fontSize: '1.1rem'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#dc2626',
    fontSize: '1.1rem'
  };

  const noDataStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
    fontSize: '1.1rem'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={loadingStyle}>
            강사진 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={errorStyle}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>강사진 소개</h1>
          <p style={subtitleStyle}>
            우수한 경력과 전문성을 갖춘 강사진이<br />
            학생들의 성장을 위해 최선을 다하고 있습니다.
          </p>
        </div>

        {teachers.length === 0 ? (
          <div style={noDataStyle}>
            등록된 강사 정보가 없습니다.
          </div>
        ) : (
          <div style={gridStyle}>
            {teachers.map((teacher) => (
              <div
                key={teacher._id}
                style={cardStyle}
                onMouseEnter={!isMobile ? (e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                } : undefined}
                onMouseLeave={!isMobile ? (e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                } : undefined}
              >
                {/* 프로필 이미지 */}
                <div style={imageContainerStyle}>
                  {teacher.profileImage ? (
                    <img
                      src={teacher.profileImage}
                      alt={`${teacher.userId?.name} 프로필`}
                      style={imageStyle}
                    />
                  ) : (
                    <div style={placeholderImageStyle}>
                      👨‍🏫
                    </div>
                  )}
                </div>

                {/* 이름 */}
                <h3 style={nameStyle}>
                  {teacher.userId?.name || '이름 없음'}
                </h3>

                {/* 담당 과목 */}
                {teacher.subjects && teacher.subjects.length > 0 && (
                  <div style={subjectsStyle}>
                    {teacher.subjects.map((subject) => (
                      <span key={subject._id} style={subjectTagStyle}>
                        {subject.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* 학력 */}
                {teacher.education && (
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>학력</div>
                    <div style={sectionContentStyle}>{teacher.education}</div>
                  </div>
                )}

                {/* 경력 */}
                {teacher.experience && (
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>주요 경력</div>
                    <div style={sectionContentStyle}>{teacher.experience}</div>
                  </div>
                )}

                {/* 소개 */}
                {teacher.biography && (
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>소개</div>
                    <div style={sectionContentStyle}>{teacher.biography}</div>
                  </div>
                )}

                {/* 전문분야 */}
                {teacher.specialties && teacher.specialties.length > 0 && (
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>전문분야</div>
                    <div style={sectionContentStyle}>
                      {teacher.specialties.join(', ')}
                    </div>
                  </div>
                )}

                {/* 자격증 */}
                {teacher.certifications && teacher.certifications.length > 0 && (
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>자격증</div>
                    <div style={sectionContentStyle}>
                      {teacher.certifications.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;