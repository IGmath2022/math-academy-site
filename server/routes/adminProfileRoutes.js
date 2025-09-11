// server/routes/adminProfileRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

router.get('/profile/:studentId', isAdmin, async (req, res) => {
  try {
    const doc = await StudentProfile.findOne({ studentId: req.params.studentId }).lean();
    res.json(doc || {});
  } catch (e) {
    console.error('[adminProfileRoutes.get]', e);
    res.status(500).json({ message: '프로필 조회 오류', error: String(e?.message || e) });
  }
});

router.post('/profile/:studentId', isAdmin, async (req, res) => {
  try {
    const set = req.body || {};
    const allow = ['school','grade','targetHigh','targetUniv','roadmap3m','roadmap6m','roadmap12m','publicOn'];
    const safeSet = {};
    allow.forEach(k => { if (set[k] !== undefined) safeSet[k] = set[k]; });
    const doc = await StudentProfile.findOneAndUpdate(
      { studentId: req.params.studentId },
      { $set: safeSet, $setOnInsert: { studentId: req.params.studentId } },
      { new: true, upsert: true }
    );
    res.json({ ok: true, doc });
  } catch (e) {
    console.error('[adminProfileRoutes.post]', e);
    res.status(500).json({ message: '프로필 저장 오류', error: String(e?.message || e) });
  }
});

module.exports = router;
