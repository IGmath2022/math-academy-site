const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/blog_show", async (req, res) => {
  let setting = await Setting.findOne({ key: "blog_show" });
  res.json({ show: setting?.value === "true" });
});
router.post("/blog_show", async (req, res) => {
  const { show } = req.body;
  await Setting.updateOne({ key: "blog_show" }, { value: show ? "true" : "false" }, { upsert: true });
  res.json({ success: true });
});

router.get("/:key", async (req, res) => {
  const found = await Setting.findOne({ key: req.params.key });
  res.json(found || {});
});
router.post("/", async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "key는 필수입니다." });
  await Setting.updateOne({ key }, { value }, { upsert: true });
  res.json({ key, value });
});
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일 없음" });
  res.json({ filename: req.file.filename });
});

module.exports = router;