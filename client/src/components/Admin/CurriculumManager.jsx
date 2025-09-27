import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CurriculumManager = () => {
  const [curricula, setCurricula] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    subject: '수학',
    grade: '',
    chapters: []
  });

  // 단원/유형 추가 상태
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    chapterId: '',
    chapterName: '',
    types: []
  });
  const [typeForm, setTypeForm] = useState({ typeId: '', typeName: '' });

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/curriculum');
      setCurricula(response.data);
    } catch (err) {
      setError('교육과정 조회 실패: ' + err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (selectedCurriculum) {
        // 수정
        await axios.put(`/api/curriculum/${selectedCurriculum.courseId}`, formData);
        setSuccess('교육과정이 성공적으로 수정되었습니다.');
      } else {
        // 생성
        await axios.post('/api/curriculum', formData);
        setSuccess('교육과정이 성공적으로 생성되었습니다.');
      }

      resetForm();
      fetchCurricula();
    } catch (err) {
      setError('저장 실패: ' + err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (curriculum) => {
    setSelectedCurriculum(curriculum);
    setFormData({
      courseId: curriculum.courseId,
      courseName: curriculum.courseName,
      subject: curriculum.subject,
      grade: curriculum.grade,
      chapters: curriculum.chapters || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/curriculum/${courseId}`);
      setSuccess('교육과정이 삭제되었습니다.');
      fetchCurricula();
    } catch (err) {
      setError('삭제 실패: ' + err.response?.data?.message || err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      courseName: '',
      subject: '수학',
      grade: '',
      chapters: []
    });
    setSelectedCurriculum(null);
    setShowAddForm(false);
    setShowChapterForm(false);
    setChapterForm({ chapterId: '', chapterName: '', types: [] });
  };

  const addChapter = () => {
    if (!chapterForm.chapterId || !chapterForm.chapterName) {
      setError('단원 ID와 이름을 입력해주세요.');
      return;
    }

    const newChapter = {
      chapterId: chapterForm.chapterId,
      chapterName: chapterForm.chapterName,
      order: formData.chapters.length + 1,
      types: chapterForm.types
    };

    setFormData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));

    setChapterForm({ chapterId: '', chapterName: '', types: [] });
    setShowChapterForm(false);
  };

  const removeChapter = (chapterIndex) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, index) => index !== chapterIndex)
    }));
  };

  const addTypeToChapter = (chapterIndex) => {
    if (!typeForm.typeId || !typeForm.typeName) {
      setError('유형 ID와 이름을 입력해주세요.');
      return;
    }

    setFormData(prev => {
      const newChapters = [...prev.chapters];
      if (!newChapters[chapterIndex].types) {
        newChapters[chapterIndex].types = [];
      }

      newChapters[chapterIndex].types.push({
        typeId: typeForm.typeId,
        typeName: typeForm.typeName,
        order: newChapters[chapterIndex].types.length + 1
      });

      return { ...prev, chapters: newChapters };
    });

    setTypeForm({ typeId: '', typeName: '' });
  };

  const removeType = (chapterIndex, typeIndex) => {
    setFormData(prev => {
      const newChapters = [...prev.chapters];
      newChapters[chapterIndex].types.splice(typeIndex, 1);
      return { ...prev, chapters: newChapters };
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      {error && (
        <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '4px', marginBottom: '10px', color: '#c00' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: '#efe', padding: '10px', borderRadius: '4px', marginBottom: '10px', color: '#060' }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          새 교육과정 추가
        </button>
      </div>

      {/* 교육과정 목록 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>교육과정 목록</h3>
        {isLoading ? (
          <div>로딩 중...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>과정 ID</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>과정명</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>학년</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>과목</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>단원 수</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>유형 수</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {curricula.map((curriculum) => (
                  <tr key={curriculum._id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{curriculum.courseId}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{curriculum.courseName}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{curriculum.grade}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{curriculum.subject}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{curriculum.totalChapters}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{curriculum.totalTypes}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEdit(curriculum)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(curriculum.courseId)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 교육과정 추가/수정 폼 */}
      {showAddForm && (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <h3>{selectedCurriculum ? '교육과정 수정' : '새 교육과정 추가'}</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>과정 ID:</label>
              <input
                type="text"
                value={formData.courseId}
                onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="예: 중학교1학년"
                disabled={selectedCurriculum} // 수정 시 ID 변경 불가
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>과정명:</label>
              <input
                type="text"
                value={formData.courseName}
                onChange={(e) => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="예: 중학교 1학년"
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>학년:</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              >
                <option value="">학년 선택</option>
                <option value="중1">중1</option>
                <option value="중2">중2</option>
                <option value="중3">중3</option>
                <option value="고1">고1</option>
                <option value="고2">고2</option>
                <option value="고3">고3</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>과목:</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>

            {/* 단원 관리 */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '16px', fontWeight: 'bold' }}>단원 관리:</label>
                <button
                  type="button"
                  onClick={() => setShowChapterForm(true)}
                  style={{
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  단원 추가
                </button>
              </div>

              {/* 단원 목록 */}
              {formData.chapters.map((chapter, chapterIndex) => (
                <div key={chapterIndex} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h5>{chapter.chapterName} ({chapter.chapterId})</h5>
                    <button
                      type="button"
                      onClick={() => removeChapter(chapterIndex)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>

                  {/* 유형 목록 */}
                  <div style={{ marginLeft: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>유형:</span>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="유형 ID"
                          value={typeForm.typeId}
                          onChange={(e) => setTypeForm(prev => ({ ...prev, typeId: e.target.value }))}
                          style={{ padding: '3px', border: '1px solid #ddd', borderRadius: '3px', width: '80px' }}
                        />
                        <input
                          type="text"
                          placeholder="유형명"
                          value={typeForm.typeName}
                          onChange={(e) => setTypeForm(prev => ({ ...prev, typeName: e.target.value }))}
                          style={{ padding: '3px', border: '1px solid #ddd', borderRadius: '3px', width: '100px' }}
                        />
                        <button
                          type="button"
                          onClick={() => addTypeToChapter(chapterIndex)}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          추가
                        </button>
                      </div>
                    </div>

                    {chapter.types?.map((type, typeIndex) => (
                      <div key={typeIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', padding: '5px', backgroundColor: '#f5f5f5', borderRadius: '3px' }}>
                        <span>{type.typeName} ({type.typeId})</span>
                        <button
                          type="button"
                          onClick={() => removeType(chapterIndex, typeIndex)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* 단원 추가 폼 */}
              {showChapterForm && (
                <div style={{ border: '2px solid #17a2b8', padding: '15px', borderRadius: '4px', backgroundColor: '#e7f3ff' }}>
                  <h5>새 단원 추가</h5>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="단원 ID (예: 수와연산)"
                      value={chapterForm.chapterId}
                      onChange={(e) => setChapterForm(prev => ({ ...prev, chapterId: e.target.value }))}
                      style={{ width: '48%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginRight: '4%' }}
                    />
                    <input
                      type="text"
                      placeholder="단원명 (예: 수와 연산)"
                      value={chapterForm.chapterName}
                      onChange={(e) => setChapterForm(prev => ({ ...prev, chapterName: e.target.value }))}
                      style={{ width: '48%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={addChapter}
                      style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      단원 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChapterForm(false)}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? '저장 중...' : (selectedCurriculum ? '수정' : '추가')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CurriculumManager;