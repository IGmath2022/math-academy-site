const { News } = require('../models');
const path = require("path");
const fs = require('fs');
const { Op } = require("sequelize");

// 전체 공지 조회
const getAll = async (req, res) => {
  const news = await News.findAll({ order: [['createdAt', 'DESC']] });
  res.json(news);
};

// 공지 등록 (여러 파일 첨부)
const create = async (req, res) => {
  const { title, content, author } = req.body;
  let files = [];
  if (req.files && req.files.length) {
    files = req.files.map(f => ({
      name: f.filename,
      originalName: f.originalname
    }));
  }
  const newNews = await News.create({ title, content, author, files });
  res.status(201).json(newNews);
};

// 공지 수정 (파일 교체/추가)
const update = async (req, res) => {
  const { title, content } = req.body;
  const news = await News.findByPk(req.params.id);
  if (!news) return res.status(404).json({ message: '공지 없음' });

  news.title = title;
  news.content = content;

  if (req.files && req.files.length) {
    const newFiles = req.files.map(f => ({
      name: f.filename,
      originalName: f.originalname
    }));
    news.files = [...(news.files || []), ...newFiles];
  }
  await news.save();
  res.json(news);
};

// 공지 삭제
const remove = async (req, res) => {
  const news = await News.findByPk(req.params.id);
  if (!news) return res.status(404).json({ message: '공지 없음' });
  await news.destroy();
  res.json({ message: '삭제 완료' });
};

// 첨부파일 다운로드 (한글/특수문자 파일명)
const download = async (req, res) => {
  const filename = req.params.file;
  const filePath = path.join(__dirname, "..", "uploads", "news", filename);

  if (!fs.existsSync(filePath)) return res.status(404).send("파일 없음");

  const news = await News.findOne({
    where: {
      files: { [Op.like]: `%${filename}%` }
    }
  });
  if (!news) return res.status(404).send("공지 또는 파일 없음");

  const fileObj = (news.files || []).find(f => f.name === filename);
  if (!fileObj) return res.status(404).send("파일 정보 없음");

  const originName = fileObj.originalName;

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=\"" + encodeURIComponent(originName).replace(/%/g, "\\x") + "\"; filename*=UTF-8''" + encodeURIComponent(originName)
  );
  res.setHeader('Content-Type', 'application/octet-stream');

  res.download(filePath, originName);
};

// ⭐️ export
module.exports = {
  getAll,
  create,
  update,
  remove,
  download,
};