const express = require('express');
const router = express.Router();
const chapterCtrl = require('../controllers/chapterController');
const { isAdmin } = require('../middleware/auth');
const { Chapter } = require('../models'); // ✅

router.get('/subject/:subjectId', chapterCtrl.getChaptersBySubject);
router.post('/subject/:subjectId', chapterCtrl.createChapter);

router.put('/:id', chapterCtrl.updateChapter);
router.delete('/:id', chapterCtrl.deleteChapter);

router.get('/', async (req, res) => {
  const chapters = await Chapter.findAll();
  res.json(chapters);
});

module.exports = router;