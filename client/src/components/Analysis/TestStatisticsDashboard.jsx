import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../api';
import { getToken, clearAuth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const TestStatisticsDashboard = ({ courseId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [testStats, setTestStats] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
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
    if (courseId) {
      loadDashboardData();
    }
  }, [courseId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/tests/statistics/dashboard/${courseId}`, withAuth()),
        axios.get(`${API_URL}/api/tests/statistics/course/${courseId}`, withAuth())
      ]);

      setDashboard(dashboardRes.data);
      setTestStats(statsRes.data);
    } catch (err) {
      if (handle401(err)) return;
      setError('대시보드 로드 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadTestDetails = async (testTemplateId) => {
    try {
      const [statsRes, questionsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/tests/statistics/${testTemplateId}`, withAuth()),
        axios.get(`${API_URL}/api/tests/statistics/${testTemplateId}/questions`, withAuth()),
        axios.get(`${API_URL}/api/tests/statistics/${testTemplateId}/categories`, withAuth())
      ]);

      setTestDetails({
        statistics: statsRes.data,
        questions: questionsRes.data,
        categories: categoriesRes.data
      });
    } catch (err) {
      if (handle401(err)) return;
      console.error('테스트 상세 로드 실패:', err);
    }
  };

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    loadTestDetails(test.testTemplateId);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#22c55e';
    if (accuracy >= 70) return '#eab308';
    if (accuracy >= 50) return '#f97316';
    return '#ef4444';
  };

  const getAccuracyBg = (accuracy) => {
    if (accuracy >= 90) return '#dcfce7';
    if (accuracy >= 70) return '#fef3c7';
    if (accuracy >= 50) return '#fed7aa';
    return '#fecaca';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>;
  if (error) return <div style={{ color: '#ef4444', padding: 20 }}>{error}</div>;

  return (
    <div style={{ display: 'grid', gap: 20, padding: 20 }}>
      {/* 전체 요약 */}
      {dashboard && (
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          color: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 24 }}>테스트 통계 대시보드</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>총 테스트 수</div>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{dashboard.totalTests}개</div>
            </div>
            <div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>총 응시 횟수</div>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{dashboard.totalAttempts}회</div>
            </div>
            {dashboard.overallSummary && (
              <div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>전체 평균 정답률</div>
                <div style={{ fontSize: 32, fontWeight: 'bold' }}>{dashboard.overallSummary.averageAccuracy}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* 테스트 목록 */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>테스트 목록</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {testStats.map((test, index) => (
              <div
                key={index}
                onClick={() => handleTestSelect(test)}
                style={{
                  padding: 12,
                  border: selectedTest?.testTemplateId === test.testTemplateId
                    ? '2px solid #3b82f6'
                    : '1px solid #e2e8f0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: selectedTest?.testTemplateId === test.testTemplateId
                    ? '#eff6ff'
                    : '#f8fafc',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  {test.testName}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {test.totalQuestions}문항 • {test.totalAttempts}명 응시
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: getAccuracyColor(test.averageAccuracy)
                  }}>
                    {test.averageAccuracy}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 선택된 테스트 상세 정보 */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {selectedTest && testDetails ? (
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                  {selectedTest.testName}
                </h3>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  {selectedTest.totalQuestions}문항 • {selectedTest.totalPoints}점 만점
                </div>
              </div>

              {/* 기본 통계 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
                padding: 16,
                backgroundColor: '#f8fafc',
                borderRadius: 8
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>평균 점수</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>
                    {testDetails.statistics.averageScore}점
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>최고점</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#22c55e' }}>
                    {testDetails.statistics.maxScore}점
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>최저점</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>
                    {testDetails.statistics.minScore}점
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>표준편차</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>
                    {testDetails.statistics.standardDeviation || 0}
                  </div>
                </div>
              </div>

              {/* 점수 분포 */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>점수 분포</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {testDetails.statistics.scoreDistribution?.map((dist, index) => (
                    <div key={index} style={{
                      textAlign: 'center',
                      padding: 8,
                      backgroundColor: '#f1f5f9',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {dist.range}점
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                        {dist.count}명
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        ({dist.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 가장 어려운 문제 TOP 5 */}
              {testDetails.questions?.hardestQuestions && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
                    가장 어려운 문제 TOP 5
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {testDetails.questions.hardestQuestions.map((q, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        backgroundColor: getAccuracyBg(q.accuracy),
                        borderRadius: 6,
                        border: `1px solid ${getAccuracyColor(q.accuracy)}20`
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {q.questionNumber}번 • {q.chapter}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {q.questionType} • {q.difficulty}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: getAccuracyColor(q.accuracy)
                          }}>
                            {q.accuracy}%
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            {q.correctCount}/{q.totalAttempts}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 단원별 정답률 */}
              {testDetails.categories?.chapterAnalysis && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
                    단원별 정답률
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {testDetails.categories.chapterAnalysis.slice(0, 5).map((chapter, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        backgroundColor: getAccuracyBg(chapter.averageAccuracy),
                        borderRadius: 6,
                        border: `1px solid ${getAccuracyColor(chapter.averageAccuracy)}20`
                      }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {chapter.chapterName}
                        </div>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: getAccuracyColor(chapter.averageAccuracy)
                        }}>
                          {chapter.averageAccuracy}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#64748b'
            }}>
              테스트를 선택하여 상세 통계를 확인하세요
            </div>
          )}
        </div>
      </div>

      {/* 전체 단원별 성능 (대시보드 데이터에서) */}
      {dashboard?.overallSummary?.chapterPerformance && (
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>전체 단원별 성능</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 12
          }}>
            {dashboard.overallSummary.chapterPerformance.map((chapter, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                backgroundColor: getAccuracyBg(chapter.averageAccuracy),
                borderRadius: 8,
                border: `1px solid ${getAccuracyColor(chapter.averageAccuracy)}20`
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {chapter.chapterName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    총 {chapter.totalAttempts}회 응시
                  </div>
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: getAccuracyColor(chapter.averageAccuracy)
                }}>
                  {chapter.averageAccuracy}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestStatisticsDashboard;