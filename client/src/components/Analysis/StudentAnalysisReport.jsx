import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../api';
import { getToken, clearAuth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const StudentAnalysisReport = ({ studentId, courseId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [weakness, setWeakness] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState('');

  const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const handle401 = (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      navigate('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (studentId && courseId) {
      loadAnalysisData();
    }
  }, [studentId, courseId]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // 병렬로 데이터 로드
      const [analysisRes, weaknessRes, rankingRes] = await Promise.all([
        axios.get(`${API_URL}/api/tests/analysis/student/${studentId}?courseId=${courseId}`, withAuth()),
        axios.get(`${API_URL}/api/tests/analysis/weakness/${studentId}/${courseId}`, withAuth()),
        axios.get(`${API_URL}/api/tests/analysis/rankings/${courseId}`, withAuth())
      ]);

      setAnalysis(analysisRes.data[0] || null);
      setWeakness(weaknessRes.data);

      // 현재 학생의 순위 찾기
      const studentRanking = rankingRes.data.find(r => r.studentId === studentId);
      setRanking(studentRanking);

    } catch (err) {
      if (handle401(err)) return;
      setError('분석 데이터 로드 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case '잘 안다': return '#22c55e';
      case '보통': return '#eab308';
      case '미흡': return '#f97316';
      case '많이 미흡': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getLevelBgColor = (level) => {
    switch (level) {
      case '잘 안다': return '#dcfce7';
      case '보통': return '#fef3c7';
      case '미흡': return '#fed7aa';
      case '많이 미흡': return '#fecaca';
      default: return '#f1f5f9';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>분석 중...</div>;
  if (error) return <div style={{ color: '#ef4444', padding: 20 }}>{error}</div>;
  if (!analysis) return <div style={{ padding: 20 }}>분석 데이터가 없습니다.</div>;

  return (
    <div style={{ display: 'grid', gap: 20, padding: 20 }}>
      {/* 전체 요약 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 24 }}>학습 분석 리포트</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>전체 정답률</div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{analysis.overallAccuracy}%</div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>응시 테스트</div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{analysis.totalTests}개</div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>총 문제 수</div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{analysis.totalQuestions}문제</div>
          </div>
          {ranking && (
            <div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>전체 순위</div>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>
                {ranking.rank}위 ({ranking.percentile}%tile)
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* 단원별 분석 */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>단원별 성취도</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {analysis.chapterAnalysis.slice(0, 8).map((chapter, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                backgroundColor: getLevelBgColor(chapter.level),
                borderRadius: 8,
                border: `1px solid ${getLevelColor(chapter.level)}20`
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{chapter.chapterName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {chapter.correctAnswers}/{chapter.totalQuestions} 문제
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: getLevelColor(chapter.level)
                  }}>
                    {chapter.accuracy}%
                  </div>
                  <div style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    backgroundColor: getLevelColor(chapter.level),
                    color: 'white',
                    borderRadius: 12
                  }}>
                    {chapter.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 유형별 분석 */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>유형별 성취도</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {analysis.typeAnalysis.slice(0, 8).map((type, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                backgroundColor: getLevelBgColor(type.level),
                borderRadius: 8,
                border: `1px solid ${getLevelColor(type.level)}20`
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{type.typeName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {type.chapterName} • {type.correctAnswers}/{type.totalQuestions}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: getLevelColor(type.level)
                  }}>
                    {type.accuracy}%
                  </div>
                  <div style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    backgroundColor: getLevelColor(type.level),
                    color: 'white',
                    borderRadius: 12
                  }}>
                    {type.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 난이도별 분석 */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>난이도별 성취도</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {analysis.difficultyAnalysis.map((diff, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                backgroundColor: getLevelBgColor(diff.level),
                borderRadius: 8,
                border: `1px solid ${getLevelColor(diff.level)}20`
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 18 }}>
                    {diff.difficulty === '상' ? '상 (어려움)' :
                     diff.difficulty === '중' ? '중 (보통)' : '하 (쉬움)'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {diff.correctAnswers}/{diff.totalQuestions} 문제
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: getLevelColor(diff.level)
                  }}>
                    {diff.accuracy}%
                  </div>
                  <div style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    backgroundColor: getLevelColor(diff.level),
                    color: 'white',
                    borderRadius: 12
                  }}>
                    {diff.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 성적 추이 */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>최근 성적 추이</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {analysis.recentScores.map((score, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#f8fafc',
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                    {score.testName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(score.testDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                    {score.score}/{score.totalScore}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {score.accuracy}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 약점 분석 및 추천사항 */}
        {weakness && (
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            gridColumn: 'span 2'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>학습 추천사항</h3>

            {weakness.recommendations.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {weakness.recommendations.map((rec, index) => (
                  <div key={index} style={{
                    padding: 16,
                    backgroundColor: rec.priority === 'high' ? '#fef2f2' : '#f0f9ff',
                    border: `1px solid ${rec.priority === 'high' ? '#fecaca' : '#bfdbfe'}`,
                    borderRadius: 8
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: rec.priority === 'high' ? '#ef4444' : '#3b82f6'
                      }} />
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {rec.title}
                      </div>
                      <div style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        backgroundColor: rec.priority === 'high' ? '#ef4444' : '#3b82f6',
                        color: 'white',
                        borderRadius: 12
                      }}>
                        {rec.priority === 'high' ? '우선' : '권장'}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
                      {rec.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 20,
                color: '#64748b',
                backgroundColor: '#f8fafc',
                borderRadius: 8
              }}>
                현재 특별한 약점이 발견되지 않았습니다. 꾸준히 학습을 이어가세요! 🎉
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalysisReport;