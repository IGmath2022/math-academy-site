const express = require('express');
const router = express.Router();
const SchoolSchedule = require('../models/SchoolSchedule');
const { isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { schoolId } = req.query;
  const where = {};
  if (schoolId) where.schoolId = schoolId;
  const schedules = await SchoolSchedule.find(where);
  res.json(schedules);
});

router.post('/', isAdmin, async (req, res) => {
  const { name, type, startDate, endDate, schoolId } = req.body;
  const schedule = await SchoolSchedule.create({ name, type, startDate, endDate, schoolId });
  res.status(201).json(schedule);
});

router.delete('/:id', isAdmin, async (req, res) => {
  const sch = await SchoolSchedule.findById(req.params.id);
  if (!sch) return res.status(404).json({ message: "일정 없음" });
  await SchoolSchedule.deleteOne({ _id: req.params.id });
  res.json({ message: "삭제 완료" });
});

module.exports = router;