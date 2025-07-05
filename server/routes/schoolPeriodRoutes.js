const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth");
const SchoolPeriod = require("../models/SchoolPeriod");
const School = require("../models/School");

router.get("/", async (req, res) => {
  const { schoolId } = req.query;
  const where = schoolId ? { schoolId } : {};
  const periods = await SchoolPeriod.find(where).populate('schoolId').sort({ start: 1 });
  res.json(periods);
});

router.post("/", isAdmin, async (req, res) => {
  const { schoolId, name, type, start, end, note } = req.body;
  const period = await SchoolPeriod.create({ schoolId, name, type, start, end, note });
  res.status(201).json(period);
});

router.put("/:id", isAdmin, async (req, res) => {
  const { name, type, start, end, note } = req.body;
  const period = await SchoolPeriod.findById(req.params.id);
  if (!period) return res.status(404).json({ message: "해당 기간 없음" });
  Object.assign(period, { name, type, start, end, note });
  await period.save();
  res.json(period);
});

router.delete("/:id", isAdmin, async (req, res) => {
  const period = await SchoolPeriod.findById(req.params.id);
  if (!period) return res.status(404).json({ message: "해당 기간 없음" });
  await SchoolPeriod.deleteOne({ _id: req.params.id });
  res.json({ message: "삭제 완료" });
});

module.exports = router;