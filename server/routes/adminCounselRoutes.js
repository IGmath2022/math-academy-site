// server/routes/adminCounselRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const CounselLog = require('../models/CounselLog');

router.get('/counsel/:studentId', isAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const rows = await CounselLog.find({ studentId: req.params.studentId })
      .sort({ date: -1, _id: -1 }).limit(limit).lean();
    res.json(rows);
  } catch (e) {
    console.error('[adminCounselRoutes.list]', e);
    res.status(500).json({ message: '상담 목록 조회 오류', error: String(e?.message || e) });
  }
});

router.post('/counsel', isAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.studentId || !b.date) return res.status(400).json({ message: 'studentId, date 필요' });
    const doc = await CounselLog.create({
      studentId: b.studentId,
      date: b.date,
      memo: b.memo || '',
      publicOn: !!b.publicOn
    });
    res.json({ ok: true, doc });
  } catch (e) {
    console.error('[adminCounselRoutes.create]', e);
    res.status(500).json({ message: '상담 등록 오류', error: String(e?.message || e) });
  }
});

router.put('/counsel/:id', isAdmin, async (req, res) => {
  try {
    const doc = await CounselLog.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ ok: true, doc });
  } catch (e) {
    console.error('[adminCounselRoutes.update]', e);
    res.status(500).json({ message: '상담 수정 오류', error: String(e?.message || e) });
  }
});

router.delete('/counsel/:id', isAdmin, async (req, res) => {
  try {
    await CounselLog.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error('[adminCounselRoutes.delete]', e);
    res.status(500).json({ message: '상담 삭제 오류', error: String(e?.message || e) });
  }
});

module.exports = router;
