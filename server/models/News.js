const mongoose = require("mongoose");

/**
 * News(공지사항) 스키마
 * - title:   필수
 * - content: 필수
 * - author:  필수 (컨트롤러에서 req.user 정보로 자동 채움)
 * - files:   첨부 파일 목록 [{ name(서버 저장명), originalName(원본명) }]
 * - createdAt: 생성시각 (기본값 now)
 */
const NewsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, default: "" },
    author: { type: String, required: true, trim: true },
    files: [
      {
        name: { type: String, required: true },          // 저장된 파일명
        originalName: { type: String, default: "" },      // 업로드 당시 파일명
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// 중복 등록 방지
module.exports = mongoose.models.News || mongoose.model("News", NewsSchema);
