const News = require("../models/News");
const path = require("path");
const fs = require("fs");

/**
 * [GET] /api/news
 * 공지 목록 (최신순)
 */
exports.getAll = async (req, res) => {
  try {
    const list = await News.find({}).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    console.error("[news] getAll error:", e);
    res.status(500).json({ message: "Failed to load news list" });
  }
};

/**
 * [GET] /api/news/:id
 * 공지 단건
 */
exports.getOne = async (req, res) => {
  try {
    const row = await News.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  } catch (e) {
    console.error("[news] getOne error:", e);
    res.status(500).json({ message: "Failed to load news" });
  }
};

/**
 * [POST] /api/news
 * 공지 생성 (관리자 권한 필요)
 * - multipart/form-data (files 필드로 첨부)
 * - author는 req.user에서 자동 채움(없으면 'admin')
 */
exports.create = async (req, res) => {
  try {
    const { title = "", content = "", author } = req.body;
    if (!title.trim()) return res.status(400).json({ message: "Title is required" });
    if (!content.trim()) return res.status(400).json({ message: "Content is required" });

    let authorStr = (typeof author === "string" && author.trim()) ? author.trim() : null;
    if (!authorStr) {
      authorStr =
        (req.user && (req.user.name || req.user.email || (req.user._id && String(req.user._id)))) ||
        "admin";
    }

    const files = (req.files || []).map((f) => ({
      name: f.filename,
      originalName: f.originalname || "",
    }));

    const doc = await News.create({
      title: title.trim(),
      content,
      author: authorStr,
      files,
    });

    res.json(doc);
  } catch (e) {
    console.error("[news] create error:", e);
    res.status(500).json({ message: "Failed to create news" });
  }
};

/**
 * [PUT] /api/news/:id
 * 공지 수정 (관리자 권한 필요)
 * - 새 파일이 오면 files 뒤에 추가(기존 보존)
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await News.findById(id);
    if (!row) return res.status(404).json({ message: "Not found" });

    const { title, content, author } = req.body;

    if (typeof title === "string" && title.trim()) row.title = title.trim();
    if (typeof content === "string") row.content = content;
    if (typeof author === "string" && author.trim()) row.author = author.trim();

    const files = (req.files || []).map((f) => ({
      name: f.filename,
      originalName: f.originalname || "",
    }));
    if (files.length) {
      row.files = [...(row.files || []), ...files];
    }

    await row.save();
    res.json(row);
  } catch (e) {
    console.error("[news] update error:", e);
    res.status(500).json({ message: "Failed to update news" });
  }
};

/**
 * [DELETE] /api/news/:id
 * 공지 삭제 (관리자 권한 필요)
 * - 업로드 폴더의 실제 파일도 best-effort 삭제
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await News.findById(id);
    if (!row) return res.status(404).json({ message: "Not found" });

    const uploadDir = path.join(process.cwd(), "uploads", "news");
    for (const f of row.files || []) {
      const full = path.join(uploadDir, f.name);
      try {
        if (fs.existsSync(full)) fs.unlinkSync(full);
      } catch (e) {
        console.warn("[news] unlink warn:", e?.message || e);
      }
    }

    await News.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) {
    console.error("[news] remove error:", e);
    res.status(500).json({ message: "Failed to delete news" });
  }
};

/**
 * [GET] /api/news/download/:filename
 * 첨부 다운로드
 */
exports.downloadByFilename = async (req, res) => {
  try {
    const { filename } = req.params;

    // 해당 파일을 가진 공지 존재 확인(보안/정합 체크)
    const news = await News.findOne({ "files.name": filename }).lean();
    if (!news) return res.status(404).send("공지 또는 파일 없음");

    const fileObj = (news.files || []).find((f) => f.name === filename);
    if (!fileObj) return res.status(404).send("파일 정보 없음");

    const uploadDir = path.join(process.cwd(), "uploads", "news");
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("파일이 존재하지 않습니다.");

    const origin = fileObj.originalName || filename;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(origin)}"; filename*=UTF-8''${encodeURIComponent(origin)}`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.download(filePath, origin);
  } catch (e) {
    console.error("[news] download error:", e);
    res.status(500).send("Failed to download");
  }
};
