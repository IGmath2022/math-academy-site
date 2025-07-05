const express = require('express');
const multer = require('multer');
const path = require('path');
const { Material } = require('../models'); // ✅
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  const list = await Material.findAll({ order: [['createdAt', 'DESC']] });
  res.json(list);
});

router.post('/', isAdmin, upload.single('file'), async (req, res) => {
  const { title, description } = req.body;
  const newMaterial = await Material.create({
    title,
    description,
    file: req.file.filename
  });
  res.status(201).json(newMaterial);
});

router.get('/download/:filename', (req, res) => {
  const file = __dirname + '/../uploads/' + req.params.filename;
  res.download(file);
});

router.delete('/:id', isAdmin, async (req, res) => {
  const mat = await Material.findByPk(req.params.id);
  if (!mat) return res.status(404).json({ message: '자료 없음' });
  await mat.destroy();
  res.json({ message: '삭제 완료' });
});

module.exports = router;