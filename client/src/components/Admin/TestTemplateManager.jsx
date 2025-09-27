// client/src/components/Admin/TestTemplateManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../api';
import { getToken, clearAuth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const TestTemplateManager = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    courseId: '',
    totalQuestions: 10,
    totalPoints: 100,
    questions: []
  });

  // 교육과정 관련 상태
  const [curricula, setCurricula] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate('/login');
      return true;
    }
    return false;
  };

  // 템플릿 목록 조회
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/tests/templates`, withAuth());
      setTemplates(data);
    } catch (err) {
      if (handle401(err)) return;
      console.error('테스트 템플릿 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 교육과정 목록 조회
  const loadCurricula = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/curriculum`, withAuth());
      setCurricula(data);
    } catch (err) {
      if (handle401(err)) return;
      console.error('교육과정 조회 실패:', err);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadCurricula();
  }, []);

  // 문항 정보 생성/업데이트
  const generateQuestions = (count) => {
    const questions = [];
    for (let i = 1; i <= count; i++) {
      questions.push({
        questionNumber: i,
        difficulty: '중',
        chapter: '',
        questionType: '계산',
        points: Math.round(formData.totalPoints / count)
      });
    }
    setFormData(prev => ({ ...prev, questions }));
  };

  // 총 문제수 변경 시 문항 정보 자동 생성
  const handleTotalQuestionsChange = (value) => {
    const count = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, totalQuestions: count }));
    if (count > 0) {
      generateQuestions(count);
    }
  };

  // 문항별 정보 업데이트
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  // 템플릿 저장
  const saveTemplate = async () => {
    try {
      if (!formData.name.trim() || !formData.subject.trim()) {
        alert('테스트명과 과목을 입력해주세요.');
        return;
      }

      const url = editingTemplate
        ? `${API_URL}/api/tests/templates/${editingTemplate._id}`
        : `${API_URL}/api/tests/templates`;

      const method = editingTemplate ? 'put' : 'post';

      await axios[method](url, formData, withAuth());

      alert(editingTemplate ? '템플릿이 수정되었습니다.' : '템플릿이 생성되었습니다.');
      resetForm();
      loadTemplates();
    } catch (err) {
      if (handle401(err)) return;
      alert('저장 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  // 교육과정 선택 핸들러
  const handleCourseChange = (courseId) => {
    const curriculum = curricula.find(c => c.courseId === courseId);
    setSelectedCurriculum(curriculum);
    setFormData(prev => ({
      ...prev,
      courseId,
      subject: curriculum?.subject || '수학'
    }));
  };

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      courseId: '',
      totalQuestions: 10,
      totalPoints: 100,
      questions: []
    });
    setEditingTemplate(null);
    setSelectedCurriculum(null);
    setShowForm(false);
  };

  // 템플릿 편집
  const editTemplate = (template) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      courseId: template.courseId || '',
      totalQuestions: template.totalQuestions,
      totalPoints: template.totalPoints,
      questions: template.questions
    });

    // 기존 교육과정 선택
    if (template.courseId) {
      const curriculum = curricula.find(c => c.courseId === template.courseId);
      setSelectedCurriculum(curriculum);
    }

    setEditingTemplate(template);
    setShowForm(true);
  };

  const commonStyles = {
    container: { display: 'grid', gap: 16 },
    button: {
      padding: '10px 16px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600
    },
    primaryButton: {
      background: '#2563eb',
      color: 'white'
    },
    secondaryButton: {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 14
    },
    card: {
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 16
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>불러오는 중...</div>;
  }

  return (
    <div style={commonStyles.container}>
      {/* 상단 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>테스트 템플릿 ({templates.length}개)</h3>
        <button
          style={{ ...commonStyles.button, ...commonStyles.primaryButton }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '목록 보기' : '+ 새 템플릿'}
        </button>
      </div>

      {/* 템플릿 생성/수정 폼 */}
      {showForm && (
        <div style={commonStyles.card}>
          <h4 style={{ marginTop: 0 }}>
            {editingTemplate ? '템플릿 수정' : '새 템플릿 생성'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <input
              style={commonStyles.input}
              placeholder="테스트명 (예: 공통수학1 중간고사)"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />

            {/* 교육과정 선택 */}
            <select
              style={commonStyles.input}
              value={formData.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">교육과정 선택</option>
              {curricula.map(curriculum => (
                <option key={curriculum.courseId} value={curriculum.courseId}>
                  {curriculum.courseName}
                </option>
              ))}
            </select>

            <input
              style={commonStyles.input}
              placeholder="과목 (예: 수학)"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              readOnly={selectedCurriculum}
            />
            <input
              style={commonStyles.input}
              type="number"
              placeholder="총 문제수"
              value={formData.totalQuestions}
              onChange={(e) => handleTotalQuestionsChange(e.target.value)}
            />
            <input
              style={commonStyles.input}
              type="number"
              placeholder="총 배점"
              value={formData.totalPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 100 }))}
            />
          </div>

          {/* 문항별 상세 설정 */}
          {formData.questions.length > 0 && (
            <div>
              <h5>문항별 설정</h5>
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8 }}>
                {formData.questions.map((q, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr',
                    gap: 8,
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < formData.questions.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{q.questionNumber}번</span>
                    <select
                      value={q.difficulty}
                      onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                      style={{ ...commonStyles.input, fontSize: 12 }}
                    >
                      <option value="하">하</option>
                      <option value="중">중</option>
                      <option value="상">상</option>
                    </select>

                    {/* 단원 선택 */}
                    <select
                      value={q.chapter}
                      onChange={(e) => updateQuestion(index, 'chapter', e.target.value)}
                      style={{ ...commonStyles.input, fontSize: 12 }}
                    >
                      <option value="">단원 선택</option>
                      {selectedCurriculum?.chapters?.map(chapter => (
                        <option key={chapter.chapterId} value={chapter.chapterName}>
                          {chapter.chapterName}
                        </option>
                      ))}
                    </select>

                    {/* 유형 선택 */}
                    <select
                      value={q.questionType}
                      onChange={(e) => updateQuestion(index, 'questionType', e.target.value)}
                      style={{ ...commonStyles.input, fontSize: 12 }}
                    >
                      <option value="">유형 선택</option>
                      {selectedCurriculum?.chapters?.find(ch => ch.chapterName === q.chapter)?.types?.map(type => (
                        <option key={type.typeId} value={type.typeName}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                    <input
                      style={{ ...commonStyles.input, fontSize: 12 }}
                      type="number"
                      placeholder="배점"
                      value={q.points}
                      onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              style={{ ...commonStyles.button, ...commonStyles.primaryButton }}
              onClick={saveTemplate}
            >
              {editingTemplate ? '수정' : '생성'}
            </button>
            <button
              style={{ ...commonStyles.button, ...commonStyles.secondaryButton }}
              onClick={resetForm}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 템플릿 목록 */}
      {!showForm && (
        <div style={{ display: 'grid', gap: 12 }}>
          {templates.length === 0 ? (
            <div style={{ ...commonStyles.card, textAlign: 'center', color: '#64748b' }}>
              생성된 테스트 템플릿이 없습니다.
            </div>
          ) : (
            templates.map(template => (
              <div key={template._id} style={commonStyles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0' }}>{template.name}</h4>
                    <div style={{ fontSize: 14, color: '#64748b' }}>
                      {template.courseId ? `${template.courseId} • ` : ''}{template.subject} • {template.totalQuestions}문항 • {template.totalPoints}점
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      생성: {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...commonStyles.button, ...commonStyles.secondaryButton, padding: '6px 12px', fontSize: 12 }}
                      onClick={() => editTemplate(template)}
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TestTemplateManager;