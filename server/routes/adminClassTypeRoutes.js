// server/routes/adminClassTypeRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const ClassType = require('../models/ClassType');

router.get('/class-types', isAdmin, async (_req, res) => {
  const rows = await ClassType.find({}).sort({ name: 1 }).lean();
  res.json(rows);
});

router.post('/class-types', isAdmin, async (req, res) => {
  const doc = await ClassType.create({ name: req.body.name, active: !!req.body.active });
  res.json({ ok: true, doc });
});

router.put('/class-types/:id', isAdmin, async (req, res) => {
  const doc = await ClassType.findByIdAndUpdate(
    req.params.id,
    { $set: { name: req.body.name, active: !!req.body.active } },
    { new: true }
  );
  res.json({ ok: true, doc });
});

router.delete('/class-types/:id', isAdmin, async (req, res) => {
  await ClassType.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
