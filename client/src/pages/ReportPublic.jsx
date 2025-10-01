// client/src/pages/ReportPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";

function fmtNewline(s) {
  return String(s || "").split(/\r?\n/).map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));
}

// 분 → "X시간 Y분"
function fmtHM(min) {
  if (min === null || min === undefined || min === "") return "-";
  const n = Number(min);
  if (!Number.isFinite(n) || n < 0) return "-";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

// 숙련도 레벨 계산
function getProficiencyLevel(accuracy, totalQuestions) {
  if (totalQuestions < 3) return { level: "부족", color: "#94a3b8", description: "데이터 부족" };

  if (accuracy >= 90) return { level: "잘 안다", color: "#059669", description: "매우 우수" };
  if (accuracy >= 70) return { level: "좋음", color: "#10b981", description: "우수" };
  if (accuracy >= 50) return { level: "보통", color: "#f59e0b", description: "보통" };
  if (accuracy >= 30) return { level: "미흡", color: "#f97316", description: "개선 필요" };
  return { level: "많이 미흡", color: "#dc2626", description: "집중 보완 필요" };
}

// 분석 표시 컴포넌트
// ?? ?? ?? ? ?? ??
function AnalysisSummaryCard({ summary, isActive, onSelect }) {
  const recentScore = summary?.recentScore || null;
  const recentDate = recentScore?.testDate ? new Date(recentScore.testDate).toLocaleDateString() : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(summary.courseId)}
      style={{
        border: isActive ? "2px solid #2563eb" : "1px solid #e2e8f0",
        background: isActive ? "#eff6ff" : "#fff",
        borderRadius: 12,
        padding: 16,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: isActive ? "0 8px 20px rgba(37, 99, 235, 0.12)" : "0 4px 12px rgba(15, 23, 42, 0.08)",
        display: "grid",
        gap: 10,
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{summary.courseName || summary.courseId || "??"}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {(summary.totalTests ?? 0)}? ? {(summary.totalQuestions ?? 0)}??
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>???</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#2563eb" }}>
            {summary.overallAccuracy != null ? `${summary.overallAccuracy}%` : "-"}
          </div>
        </div>
      </div>
      {recentScore ? (
        <div style={{ fontSize: 12, color: "#64748b" }}>
          ?? ??: {recentScore.testName || "-"}
          {" "}?{" "}
          {recentDate || "-"}
          {" "}?{" "}
          {recentScore.accuracy != null ? `${recentScore.accuracy}%` : "-"}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#94a3b8" }}>?? ?? ??? ????.</div>
      )}
      {summary.lastUpdated && (
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          ????: {new Date(summary.lastUpdated).toLocaleDateString()}
        </div>
      )}
    </button>
  );
}

function CourseAnalysisPanel({ analysis, weakness }) {
  if (!analysis) {
    return (
      <div style={{ textAlign: "center", padding: 32, color: "#64748b", background: "#f8fafc", borderRadius: 12 }}>
        ?? ???? ?? ? ????.
      </div>
    );
  }

  const overallAccuracy =
    analysis.overallAccuracy != null
      ? analysis.overallAccuracy
      : analysis.totalQuestions > 0
        ? Math.round((analysis.totalCorrect / analysis.totalQuestions) * 100)
        : 0;

  const recentScores = Array.isArray(analysis.recentScores) ? analysis.recentScores : [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
          color: "white",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 12px 30px rgba(37, 99, 235, 0.25)",
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>?? ??</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
              {analysis.courseName || analysis.courseId || "??"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>?? ???</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{overallAccuracy}%</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>? ??</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{analysis.totalTests || 0}?</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>? ??</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{analysis.totalQuestions || 0}??</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>?? ?</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{analysis.totalCorrect || 0}?</div>
          </div>
          {analysis.lastUpdated && (
            <div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>??? ????</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {new Date(analysis.lastUpdated).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {analysis.chapterAnalysis?.length ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>??? ?? ??</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {analysis.chapterAnalysis.slice(0, 8).map((chapter, index) => {
              const info = getProficiencyLevel(chapter.accuracy, chapter.totalQuestions);
              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{chapter.chapterName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {chapter.correctAnswers}/{chapter.totalQuestions} ??
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginRight: 12 }}>{chapter.accuracy}%</div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: info.color,
                      color: "white",
                    }}
                  >
                    {info.level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {analysis.typeAnalysis?.length ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>??? ?? ??</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {analysis.typeAnalysis.slice(0, 8).map((type, index) => {
              const info = getProficiencyLevel(type.accuracy, type.totalQuestions);
              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{type.typeName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {type.chapterName} ? {type.correctAnswers}/{type.totalQuestions} ??
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginRight: 12 }}>{type.accuracy}%</div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: info.color,
                      color: "white",
                    }}
                  >
                    {info.level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {analysis.difficultyAnalysis?.length ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>???? ?? ??</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {analysis.difficultyAnalysis.map((difficulty, index) => {
              const info = getProficiencyLevel(difficulty.accuracy, difficulty.totalQuestions);
              return (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 10,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{difficulty.difficulty} ???</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: info.color, marginBottom: 4 }}>{difficulty.accuracy}%</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {difficulty.correctAnswers}/{difficulty.totalQuestions} ??
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: info.color,
                      color: "white",
                    }}
                  >
                    {info.level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {recentScores.length ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>?? ?? ??</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {recentScores.map((score, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{score.testName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {score.testDate ? new Date(score.testDate).toLocaleDateString() : "-"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                    {score.score}/{score.totalScore}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{score.accuracy}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {weakness ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>?? ?? ??</h3>
          {weakness.recommendations?.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {weakness.recommendations.map((rec, index) => (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: rec.priority === 'high' ? '#fef2f2' : '#f0f9ff',
                    border: `1px solid ${rec.priority === 'high' ? '#fecaca' : '#bfdbfe'}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: rec.priority === 'high' ? '#ef4444' : '#2563eb',
                        display: 'inline-block',
                      }}
                    />
                    <strong style={{ color: "#1e293b" }}>{rec.title}</strong>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: rec.priority === 'high' ? '#ef4444' : '#2563eb',
                        color: 'white',
                      }}
                    >
                      {rec.priority === 'high' ? '??' : '??'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{rec.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 18, color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
              ?? ??? ????. ??? ??? ??????!
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ReportPublic() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("report");
  const [testResults, setTestResults] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [analysisSummaries, setAnalysisSummaries] = useState([]);
  const [analysisDetailMap, setAnalysisDetailMap] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loadingAnalysisSummary, setLoadingAnalysisSummary] = useState(false);
  const [loadingAnalysisDetail, setLoadingAnalysisDetail] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/reports/public/${code}`);
        if (mounted) setData(data);
      } catch {
        setErr("리포트를 불러올 수 없습니다.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [code]);

  // 테스트 결과 로드
  const loadTestResults = async () => {
    if (loadingTests || testResults.length > 0) return;

    try {
      setLoadingTests(true);
      const { data } = await axios.get(`${API_URL}/api/tests/results/public/${code}`);
      setTestResults(data);
    } catch (error) {
      console.error('테스트 결과 로드 실패:', error);
    } finally {
      setLoadingTests(false);
    }
  };

  // 분석 데이터 로드
  const loadAnalysisDetail = async (courseId, { select = true, force = false } = {}) => {
    if (!courseId) return;

    if (select) {
      setSelectedCourseId(courseId);
    }

    if (!force && analysisDetailMap[courseId]) {
      return;
    }

    setAnalysisError("");

    try {
      setLoadingAnalysisDetail(true);
      const { data } = await axios.get(`${API_URL}/api/tests/analysis/public/${code}/course/${courseId}`);
      setAnalysisDetailMap((prev) => ({ ...prev, [courseId]: data }));
    } catch (error) {
      console.error('?? ?? ?? ??:', error);
      setAnalysisError('?? ??? ???? ?????.');
    } finally {
      setLoadingAnalysisDetail(false);
    }
  };

  const loadAnalysisSummary = async () => {
    if (loadingAnalysisSummary || analysisSummaries.length > 0) return;

    try {
      setLoadingAnalysisSummary(true);
      setAnalysisError("");
      const { data } = await axios.get(`${API_URL}/api/tests/analysis/public/${code}/summary`);
      const summaries = Array.isArray(data?.summaries) ? data.summaries : [];
      setAnalysisSummaries(summaries);

      if (summaries.length > 0) {
        const firstCourseId = summaries[0].courseId;
        const nextCourseId = summaries.some((item) => item.courseId === selectedCourseId)
          ? selectedCourseId
          : firstCourseId;
        setSelectedCourseId(nextCourseId);
        if (!analysisDetailMap[nextCourseId]) {
          await loadAnalysisDetail(nextCourseId, { select: false });
        }
      }
    } catch (error) {
      console.error('?? ?? ?? ??:', error);
      setAnalysisError('?? ??? ???? ?????.');
    } finally {
      setLoadingAnalysisSummary(false);
    }
  };

  // ? ?? ? ??? ??
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "tests") {
      loadTestResults();
    } else if (tab === "analysis") {
      loadAnalysisSummary();
    }
  };

  const handleCourseSelect = (courseId) => {
    if (!courseId) return;
    loadAnalysisDetail(courseId);
  };

  if (err) return <div style={{ maxWidth: 920, margin: "32px auto", padding: 16 }}>{err}</div>;
  if (!data) return <div style={{ maxWidth: 920, margin: "32px auto", padding: 16 }}>불러오는 중…</div>;

  const { student, log, attendance, recent = [], profile, counsels } = data;
  const dateLabel = log?.dateLabel || log?.date || "";
  const teacherDisp = log?.teacherName || log?.teacher || "-";
  const durMin = data?.studyTimeMin ?? log?.durationMin;

  // 최근 5회만 요약 (서버가 10회 줘도 5개 컷)
  const recent5 = recent.slice(0, 5);

  // ✅ 다음 수업 계획: planNext 우선, 구버전 nextPlan 호환
  const nextPlan = log?.planNext || log?.nextPlan || "";

  return (
    <div
      style={{
        fontFamily:
          "Pretendard, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, sans-serif",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 920, margin: "24px auto", padding: 20 }}>
        {/* 헤더 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 6px 20px #0001",
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              padding: "22px 26px",
              background: "linear-gradient(180deg,#f7fbff,#eef4ff)",
            }}
          >
            <div style={{ color: "#5a6", fontSize: 14, fontWeight: 700 }}>
              IG수학학원 개인 리포트
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 2px" }}>
              {student?.name || "학생"} 학생
            </div>
            <div style={{ color: "#6a7" }}>{(log?.course || "-")} · {dateLabel}</div>
          </div>

          {/* 탭 네비게이션 */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid #e5ecff",
            background: "#f9fbff"
          }}>
            <button
              style={{
                padding: "12px 24px",
                border: "none",
                background: activeTab === "report" ? "#fff" : "transparent",
                color: activeTab === "report" ? "#2563eb" : "#64748b",
                fontWeight: activeTab === "report" ? 700 : 500,
                cursor: "pointer",
                borderBottom: activeTab === "report" ? "2px solid #2563eb" : "2px solid transparent",
                borderRadius: "0"
              }}
              onClick={() => handleTabChange("report")}
            >
              일일 리포트
            </button>
            <button
              style={{
                padding: "12px 24px",
                border: "none",
                background: activeTab === "tests" ? "#fff" : "transparent",
                color: activeTab === "tests" ? "#2563eb" : "#64748b",
                fontWeight: activeTab === "tests" ? 700 : 500,
                cursor: "pointer",
                borderBottom: activeTab === "tests" ? "2px solid #2563eb" : "2px solid transparent",
                borderRadius: "0"
              }}
              onClick={() => handleTabChange("tests")}
            >
              테스트 성적
            </button>
            <button
              style={{
                padding: "12px 24px",
                border: "none",
                background: activeTab === "analysis" ? "#fff" : "transparent",
                color: activeTab === "analysis" ? "#2563eb" : "#64748b",
                fontWeight: activeTab === "analysis" ? 700 : 500,
                cursor: "pointer",
                borderBottom: activeTab === "analysis" ? "2px solid #2563eb" : "2px solid transparent",
                borderRadius: "0"
              }}
              onClick={() => handleTabChange("analysis")}
            >
              학습 분석
            </button>
          </div>

          {/* 탭 내용 */}
          {activeTab === "report" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
                padding: "18px 26px",
              }}
            >
            <div>
              <Section title="과정" body={fmtNewline(log?.course)} />
              <Section title="교재" body={fmtNewline(log?.book)} />
              <Section title="수업내용" body={fmtNewline(log?.content)} />
              <Section title="과제" body={fmtNewline(log?.homework)} />
              <Section title="개별 피드백" body={fmtNewline(log?.feedback)} />
              {/* ✅ (원한다면 왼쪽 칼럼으로 옮길 수도 있음) */}
            </div>

            <div>
              <Section
                title="출결"
                body={
                  <>
                    등원 {attendance?.checkIn || log?.inTime || "-"} / 하원{" "}
                    {attendance?.checkOut || log?.outTime || "-"}
                  </>
                }
              />
              <Section title="학습시간" body={fmtHM(durMin)} />
              <Section title="형태·강사" body={<>{log?.classType || "-"} / {teacherDisp}</>} />
              {!!log?.headline && <Section title="핵심 한줄" body={fmtNewline(log.headline)} />}
              <Section
                title="태그"
                body={
                  (log?.tags || []).length ? (
                    <div>
                      {log.tags.map((t, i) => (
                        <span key={i} style={tag}>
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>-</>
                  )
                }
              />
              {/* ✅ 다음 수업 계획 (planNext/nextPlan 호환) */}
              <Section title="다음 수업 계획" body={fmtNewline(nextPlan)} />
            </div>
            </div>
          )}

          {/* 테스트 성적 탭 */}
          {activeTab === "tests" && (
            <div style={{ padding: "18px 26px" }}>
              {loadingTests ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  테스트 결과를 불러오는 중...
                </div>
              ) : testResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  등록된 테스트 결과가 없습니다.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {testResults.map((result) => (
                    <TestResultCard key={result._id} result={result} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 학습 분석 탭 */}
          {activeTab === "analysis" && (
            <div style={{ padding: "18px 26px", display: "grid", gap: 20 }}>
              {analysisError ? (
                <div style={{ textAlign: "center", padding: 40, color: "#ef4444", background: "#fef2f2", borderRadius: 12 }}>
                  {analysisError}
                </div>
              ) : loadingAnalysisSummary ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  ?? ??? ???? ????...
                </div>
              ) : analysisSummaries.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  ?? ?? ???? ????.
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                    {analysisSummaries.map((summary) => (
                      <AnalysisSummaryCard
                        key={summary.courseId}
                        summary={summary}
                        isActive={summary.courseId === selectedCourseId}
                        onSelect={handleCourseSelect}
                      />
                    ))}
                  </div>
                  {loadingAnalysisDetail && !analysisDetailMap[selectedCourseId] ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                      ?? ??? ???? ????...
                    </div>
                  ) : (
                    <CourseAnalysisPanel
                      analysis={analysisDetailMap[selectedCourseId]?.analysis}
                      weakness={analysisDetailMap[selectedCourseId]?.weakness}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 누적 5회 요약 - 일일 리포트 탭에만 표시 */}
        {activeTab === "report" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 6px 20px #0001",
              overflow: "hidden",
              marginBottom: 18,
            }}
          >
          <div
            style={{
              padding: "22px 26px",
              background: "linear-gradient(180deg,#f7fbff,#eef4ff)",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800 }}>누적 5회 지표</div>
          </div>
          <div style={{ padding: "12px 18px 18px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f7f9ff" }}>
                  <Th>날짜</Th>
                  <Th>과정</Th>
                  <Th>집중도</Th>
                  <Th>진행률</Th>
                  <Th>학습시간</Th>
                  <Th>핵심/태그</Th>
                  <Th>보기</Th>
                </tr>
              </thead>
              <tbody>
                {recent5.map((r) => (
                  <tr key={r._id}>
                    <Td>{r.date}</Td>
                    <Td>{r.course || "-"}</Td>
                    <Td>{r.focus ?? "-"}</Td>
                    <Td>{r.progressPct ?? "-"}</Td>
                    <Td>{fmtHM(r.studyTimeMin)}</Td>
                    <Td>
                      {(r.headline || "")
                        .split(/\r?\n/)
                        .map((ln, i) => (
                          <span key={i}>
                            {ln}
                            <br />
                          </span>
                        ))}
                      {(r.tags || []).map((t, i) => (
                        <span key={i} style={tag}>
                          {t}
                        </span>
                      ))}
                    </Td>
                    <Td>
                      <a href={`/r/${r._id}`} target="_blank" rel="noreferrer">
                        열람
                      </a>
                    </Td>
                  </tr>
                ))}
                {recent5.length === 0 && (
                  <tr>
                    <Td colSpan={7} style={{ color: "#888", textAlign: "center" }}>
                      표시할 기록이 없습니다.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* (선택) 프로필·로드맵 - 일일 리포트 탭에만 표시 */}
        {activeTab === "report" && profile?.publicOn && (
          <div style={card}>
            <div style={hd}>
              <div style={tit}>프로필 & 로드맵</div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "18px 26px" }}
            >
              <div>
                <Section
                  title="학교/학년"
                  body={
                    <>
                      {profile.school || "-"} {profile.grade || ""}
                    </>
                  }
                />
                <Section
                  title="희망 진학"
                  body={<>{profile.targetHigh || profile.targetUniv || "-"}</>}
                />
              </div>
              <div>
                <div style={{ marginBottom: 10, fontWeight: 700, color: "#223" }}>
                  목표(3/6/12개월)
                </div>
                <div style={box}>
                  <div>
                    <b>3개월</b> — {profile.roadmap3m || "-"}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b>6개월</b> — {profile.roadmap6m || "-"}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b>12개월</b> — {profile.roadmap12m || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* (선택) 최근 상담 3건 - 일일 리포트 탭에만 표시 */}
        {activeTab === "report" && !!(counsels || []).length && (
          <div style={card}>
            <div style={hd}>
              <div style={tit}>최근 상담 메모</div>
            </div>
            <div style={{ padding: "18px 26px" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {counsels.map((c, i) => (
                  <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f0f2f8" }}>
                    <b>{c.date}</b> — {c.memo}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 6px 20px #0001",
            padding: "14px 26px",
            textAlign: "center",
            color: "#6a7",
          }}
        >
          이 링크는 리포트 열람용 공개 페이지입니다.
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ margin: "4px 0 10px", fontSize: 16, color: "#223", fontWeight: 700 }}>
        {title}
      </div>
      <div style={box}>{body || "-"}</div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        borderBottom: "1px solid #eef2ff",
        padding: "10px 8px",
        textAlign: "left",
        fontSize: 14,
      }}
    >
      {children}
    </th>
  );
}
function Td({ children, colSpan }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        borderBottom: "1px solid #eef2ff",
        padding: "10px 8px",
        textAlign: "left",
        fontSize: 14,
      }}
    >
      {children}
    </td>
  );
}

const card = { background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px #0001", overflow: "hidden", marginBottom: 18 };
const hd = { padding: "22px 26px", background: "linear-gradient(180deg,#f7fbff,#eef4ff)" };
const tit = { fontSize: 20, fontWeight: 800 };
const box = { background: "#f9fbff", border: "1px solid #e5ecff", borderRadius: 12, padding: 14 };
const tag = {
  display: "inline-block",
  background: "#eef2ff",
  border: "1px solid #dde5ff",
  color: "#345",
  padding: "2px 8px",
  borderRadius: 999,
  marginRight: 6,
  marginBottom: 6,
  fontSize: 12,
};

// 테스트 결과 카드 컴포넌트
function TestResultCard({ result }) {
  const { testTemplateId, totalScore, totalPossibleScore, testDate, difficultyStats, timeSpent } = result;
  const scorePercentage = Math.round((totalScore / totalPossibleScore) * 100);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "#10b981";
    if (percentage >= 80) return "#3b82f6";
    if (percentage >= 70) return "#f59e0b";
    if (percentage >= 60) return "#ef4444";
    return "#6b7280";
  };

  const getGradeText = (percentage) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
            {testTemplateId?.name || "테스트"}
          </h4>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            {testTemplateId?.subject} • {new Date(testDate).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 24,
            fontWeight: 800,
            color: getGradeColor(scorePercentage),
            marginBottom: 2
          }}>
            {getGradeText(scorePercentage)}
          </div>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            {totalScore}/{totalPossibleScore}점 ({scorePercentage}%)
          </div>
        </div>
      </div>

      {/* 점수 바 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          width: "100%",
          height: 8,
          background: "#f1f5f9",
          borderRadius: 4,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${scorePercentage}%`,
            height: "100%",
            background: getGradeColor(scorePercentage),
            borderRadius: 4,
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>

      {/* 난이도별 분석 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { key: "easy", label: "하급", color: "#10b981" },
          { key: "medium", label: "중급", color: "#3b82f6" },
          { key: "hard", label: "상급", color: "#ef4444" }
        ].map(({ key, label, color }) => {
          const stat = difficultyStats?.[key];
          const percentage = stat?.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;

          return (
            <div key={key} style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 2 }}>
                {percentage}%
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {stat?.correct || 0}/{stat?.total || 0}
              </div>
            </div>
          );
        })}
      </div>

      {/* 추가 정보 */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
        <span>총 {testTemplateId?.totalQuestions || 0}문항</span>
        {timeSpent && <span>소요시간: {timeSpent}분</span>}
      </div>
    </div>
  );
}
