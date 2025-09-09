// server/routes/adminProfileRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

router.get('/profile/:studentId', isAdmin, async (req, res) => {
  const doc = await StudentProfile.findOne({ studentId: req.params.studentId }).lean();
  res.json(doc || {});
});

router.post('/profile/:studentId', isAdmin, async (req, res) => {
  const set = req.body || {};
  const doc = await StudentProfile.findOneAndUpdate(
    { studentId: req.params.studentId },
    { $set: set, $setOnInsert: { studentId: req.params.studentId } },
    { new: true, upsert: true }
  );
  res.json({ ok: true, doc });
});

module.exports = router;
