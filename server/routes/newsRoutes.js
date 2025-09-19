const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// 👉 프로젝트의 권한 미들웨어 네이밍을 존중 (isAdmin 사용)
//    필요 시 requireAdminOrSuper 로 바꿔도 됨.
const { isAdmin } = require("../middleware/auth");

const newsController = require("../controllers/newsController");

const router = express.Router();

// 업로드 폴더 준비: /uploads/news
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "news");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function safeFileName(originalname) {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/[^\w.-]/g, "_");
  const stamp = Date.now() + "-" + Math.round(Math.random() * 1e9);
  return `${stamp}-${base}${ext}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, safeFileName(file.originalname)),
});

const upload = multer({ storage });

// 목록/단건 (공개 가능)
router.get("/", newsController.getAll);
router.get("/:id", newsController.getOne);

// 생성/수정/삭제 (관리자 보호) + 첨부 업로드
router.post("/", isAdmin, upload.array("files", 10), newsController.create);
router.put("/:id", isAdmin, upload.array("files", 10), newsController.update);
router.delete("/:id", isAdmin, newsController.remove);

// 첨부 다운로드
router.get("/download/:filename", newsController.downloadByFilename);

module.exports = router;
