// client/src/components/Admin/TestResultManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../api';
import { getToken, clearAuth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const TestResultManager = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeSpent, setTimeSpent] = useState(60);
  const [notes, setNotes] = useState('');

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate('/login');
      return true;
    }
    return false;
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/tests/templates`, withAuth()),
        axios.get(`${API_URL}/api/users?role=student`, withAuth())
      ]);

      setTemplates(templatesRes.data);
      setStudents(studentsRes.data || []);
    } catch (err) {
      if (handle401(err)) return;
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 테스트 선택 시 답안 배열 초기화
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const initialAnswers = template.questions.map(q => ({
      questionNumber: q.questionNumber,
      isCorrect: false,
      studentAnswer: ''
    }));
    setAnswers(initialAnswers);
  };

  // 답안 업데이트
  const updateAnswer = (questionNumber, field, value) => {
    setAnswers(prev => prev.map(answer =>
      answer.questionNumber === questionNumber
        ? { ...answer, [field]: value }
        : answer
    ));
  };

  // 점수 계산
  const calculateScore = () => {
    if (!selectedTemplate) return 0;

    let totalScore = 0;
    answers.forEach(answer => {
      if (answer.isCorrect) {
        const question = selectedTemplate.questions.find(q => q.questionNumber === answer.questionNumber);
        totalScore += question ? question.points : 0;
      }
    });

    return totalScore;
  };

  // 성적 저장
  const saveResult = async () => {
    try {
      if (!selectedTemplate || !selectedStudent) {
        alert('테스트와 학생을 선택해주세요.');
        return;
      }

      setSaving(true);

      const totalScore = calculateScore();
      const resultData = {
        studentId: selectedStudent._id,
        testTemplateId: selectedTemplate._id,
        totalScore,
        totalPossibleScore: selectedTemplate.totalPoints,
        answers,
        timeSpent,
        notes
      };

      await axios.post(`${API_URL}/api/tests/results`, resultData, withAuth());

      alert('성적이 저장되었습니다.');

      // 폼 리셋
      setSelectedTemplate(null);
      setSelectedStudent(null);
      setAnswers([]);
      setTimeSpent(60);
      setNotes('');

    } catch (err) {
      if (handle401(err)) return;
      console.error('저장 실패 상세:', err);
      console.error('응답 데이터:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert('저장 실패: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const commonStyles = {
    container: { display: 'grid', gap: 16 },
    card: {
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 16
    },
    button: {
      padding: '8px 16px',
      borderRadius: 6,
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
    select: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 14
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 14
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>불러오는 중...</div>;
  }

  return (
    <div style={commonStyles.container}>
      {/* 테스트 및 학생 선택 */}
      <div style={commonStyles.card}>
        <h4 style={{ marginTop: 0 }}>테스트 및 학생 선택</h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              테스트 선택
            </label>
            <select
              style={commonStyles.select}
              value={selectedTemplate?._id || ''}
              onChange={(e) => {
                const template = templates.find(t => t._id === e.target.value);
                handleTemplateSelect(template);
              }}
            >
              <option value="">테스트를 선택하세요</option>
              {templates.map(template => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              학생 선택
            </label>
            <select
              style={commonStyles.select}
              value={selectedStudent?._id || ''}
              onChange={(e) => {
                const student = students.find(s => s._id === e.target.value);
                setSelectedStudent(student);
              }}
            >
              <option value="">학생을 선택하세요</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.name} {student.grade ? `(${student.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTemplate && selectedStudent && (
          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <strong>{selectedStudent.name}</strong>님의 <strong>{selectedTemplate.name}</strong> 성적 입력
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              총 {selectedTemplate.totalQuestions}문항 • {selectedTemplate.totalPoints}점 만점
            </div>
          </div>
        )}
      </div>

      {/* 답안 입력 */}
      {selectedTemplate && selectedStudent && (
        <div style={commonStyles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>답안 입력</h4>
            <div style={{ fontSize: 14, color: '#2563eb', fontWeight: 600 }}>
              현재 점수: {calculateScore()} / {selectedTemplate.totalPoints}점
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}>
            {selectedTemplate.questions.map((question, index) => (
              <div key={question.questionNumber} style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                background: answers[index]?.isCorrect ? '#f0fdf4' : '#fff',
                border: answers[index]?.isCorrect ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                borderRadius: 8
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 40 }}>
                  {question.questionNumber}번
                </span>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                    {question.chapter} • {question.questionType}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {question.difficulty}급 • {question.points}점
                  </div>
                </div>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  background: answers[index]?.isCorrect ? '#22c55e' : '#f1f5f9',
                  color: answers[index]?.isCorrect ? 'white' : '#64748b',
                  borderRadius: 6,
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={answers[index]?.isCorrect || false}
                    onChange={(e) => updateAnswer(question.questionNumber, 'isCorrect', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  {answers[index]?.isCorrect ? '정답' : '오답'}
                </label>
              </div>
            ))}
          </div>

          {/* 추가 정보 입력 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, marginTop: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                소요 시간 (분)
              </label>
              <input
                style={{ ...commonStyles.input, width: 80 }}
                type="number"
                value={timeSpent}
                onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                메모
              </label>
              <input
                style={commonStyles.input}
                placeholder="추가 메모나 특이사항"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button
              style={{ ...commonStyles.button, ...commonStyles.secondaryButton }}
              onClick={() => {
                setSelectedTemplate(null);
                setSelectedStudent(null);
                setAnswers([]);
              }}
            >
              취소
            </button>
            <button
              style={{
                ...commonStyles.button,
                ...commonStyles.primaryButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
              onClick={saveResult}
              disabled={saving}
            >
              {saving ? '저장 중...' : '성적 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultManager;