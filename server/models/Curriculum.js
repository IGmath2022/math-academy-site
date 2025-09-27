const mongoose = require('mongoose');

// 단원 스키마
const ChapterSchema = new mongoose.Schema({
  chapterId: { type: String, required: true }, // 단원 고유 ID
  chapterName: { type: String, required: true }, // 단원명
  order: { type: Number, required: true }, // 단원 순서
  types: [{
    typeId: { type: String, required: true }, // 유형 고유 ID
    typeName: { type: String, required: true }, // 유형명
    order: { type: Number, required: true } // 유형 순서
  }]
});

// 교육과정 스키마
const CurriculumSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true }, // 과정 고유 ID
  courseName: { type: String, required: true }, // 과정명 (중학교 1학년, 고등학교 1학년 등)
  subject: { type: String, required: true, default: '수학' }, // 과목
  grade: { type: String, required: true }, // 학년 (중1, 중2, 중3, 고1, 고2, 고3)
  chapters: [ChapterSchema], // 단원 배열
  isActive: { type: Boolean, default: true }, // 활성 상태
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 생성자
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // 수정자
}, { timestamps: true });

// 인덱스 설정
CurriculumSchema.index({ courseId: 1 }, { unique: true });
CurriculumSchema.index({ grade: 1 });
CurriculumSchema.index({ 'chapters.chapterId': 1 });

// 가상 필드 - 총 단원 수
CurriculumSchema.virtual('totalChapters').get(function() {
  return this.chapters.length;
});

// 가상 필드 - 총 유형 수
CurriculumSchema.virtual('totalTypes').get(function() {
  return this.chapters.reduce((total, chapter) => total + chapter.types.length, 0);
});

// 메서드 - 특정 단원 찾기
CurriculumSchema.methods.findChapter = function(chapterId) {
  return this.chapters.find(chapter => chapter.chapterId === chapterId);
};

// 메서드 - 특정 유형 찾기
CurriculumSchema.methods.findType = function(chapterId, typeId) {
  const chapter = this.findChapter(chapterId);
  if (!chapter) return null;
  return chapter.types.find(type => type.typeId === typeId);
};

// 메서드 - 단원 추가
CurriculumSchema.methods.addChapter = function(chapterData) {
  const maxOrder = this.chapters.length > 0 ? Math.max(...this.chapters.map(c => c.order)) : 0;
  this.chapters.push({
    ...chapterData,
    order: maxOrder + 1,
    types: chapterData.types || []
  });
};

// 메서드 - 유형 추가
CurriculumSchema.methods.addType = function(chapterId, typeData) {
  const chapter = this.findChapter(chapterId);
  if (!chapter) throw new Error('단원을 찾을 수 없습니다');

  const maxOrder = chapter.types.length > 0 ? Math.max(...chapter.types.map(t => t.order)) : 0;
  chapter.types.push({
    ...typeData,
    order: maxOrder + 1
  });
};

// JSON 변환 시 가상 필드 포함
CurriculumSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Curriculum', CurriculumSchema);