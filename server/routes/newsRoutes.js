const express = require("express");
const router = express.Router();
const path = require("path");
const newsController = require("../controllers/newsController");
const { isAdmin } = require("../middleware/auth");
const multer = require("multer");

function safeFileName(originalname) {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/[^\w.-]/g, "_");
  const timestamp = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return timestamp + '-' + base + ext;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "news"));
  },
  filename: (req, file, cb) => {
    cb(null, safeFileName(file.originalname));
  }
});
const upload = multer({ storage });

router.get("/", newsController.getAll);
router.post("/", isAdmin, upload.array("files", 10), newsController.create);
router.put("/:id", isAdmin, upload.array("files", 10), newsController.update);
router.delete("/:id", isAdmin, newsController.remove);
router.get("/download/:file", newsController.download);

module.exports = router;