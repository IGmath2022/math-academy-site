// server/routes/adminClassTypeRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const ClassType = require('../models/ClassType');

router.get('/class-types', isAdmin, async (_req, res) => {
  try {
    const rows = await ClassType.find({}).sort({ name: 1 }).lean();
    res.json(rows);
  } catch (e) {
    console.error('[adminClassTypeRoutes.list]', e);
    res.status(500).json({ message: '수업형태 목록 조회 오류', error: String(e?.message || e) });
  }
});

router.post('/class-types', isAdmin, async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'name 필수' });
    const doc = await ClassType.create({ name, active: !!req.body.active });
    res.json({ ok: true, doc });
  } catch (e) {
    console.error('[adminClassTypeRoutes.create]', e);
    res.status(500).json({ message: '수업형태 생성 오류', error: String(e?.message || e) });
  }
});

router.put('/class-types/:id', isAdmin, async (req, res) => {
  try {
    const doc = await ClassType.findByIdAndUpdate(
      req.params.id,
      { $set: { name: req.body.name, active: !!req.body.active } },
      { new: true }
    );
    res.json({ ok: true, doc });
  } catch (e) {
    console.error('[adminClassTypeRoutes.update]', e);
    res.status(500).json({ message: '수업형태 수정 오류', error: String(e?.message || e) });
  }
});

router.delete('/class-types/:id', isAdmin, async (req, res) => {
  try {
    await ClassType.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error('[adminClassTypeRoutes.delete]', e);
    res.status(500).json({ message: '수업형태 삭제 오류', error: String(e?.message || e) });
  }
});

module.exports = router;
