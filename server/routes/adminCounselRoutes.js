// server/routes/adminCounselRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const CounselLog = require('../models/CounselLog');

router.get('/counsel/:studentId', isAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const rows = await CounselLog.find({ studentId: req.params.studentId })
    .sort({ date: -1 }).limit(limit).lean();
  res.json(rows);
});

router.post('/counsel', isAdmin, async (req, res) => {
  const b = req.body || {};
  if (!b.studentId || !b.date) return res.status(400).json({ message: 'studentId, date 필요' });
  const doc = await CounselLog.create({
    studentId: b.studentId,
    date: b.date,
    memo: b.memo || '',
    publicOn: !!b.publicOn
  });
  res.json({ ok: true, doc });
});

router.put('/counsel/:id', isAdmin, async (req, res) => {
  const doc = await CounselLog.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  res.json({ ok: true, doc });
});

router.delete('/counsel/:id', isAdmin, async (req, res) => {
  await CounselLog.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
