const express = require("express");
const router = express.Router();
const { Setting } = require("../models");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// ⚠️ 먼저 구체적인 경로(블로그 show)부터 등록!
router.get("/blog_show", async (req, res) => {
  let setting = await Setting.findOne({ where: { key: "blog_show" } });
  res.json({ show: setting?.value === "true" });
});
router.post("/blog_show", async (req, res) => {
  const { show } = req.body;
  await Setting.upsert({ key: "blog_show", value: show ? "true" : "false" });
  res.json({ success: true });
});

// 일반적인 key-value 조회/저장
router.get("/:key", async (req, res) => {
  const found = await Setting.findOne({ where: { key: req.params.key } });
  res.json(found || {});
});
router.post("/", async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "key는 필수입니다." });
  let setting = await Setting.findOne({ where: { key } });
  if (setting) {
    setting.value = value;
    await setting.save();
  } else {
    setting = await Setting.create({ key, value });
  }
  res.json(setting);
});
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일 없음" });
  res.json({ filename: req.file.filename });
});

module.exports = router;