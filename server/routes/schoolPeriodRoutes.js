// server/routes/schoolPeriodRoutes.js
const express = require("express");
const router = express.Router();
const { requireAdminOrSuper } = require("../middleware/auth");
const SchoolPeriod = require("../models/SchoolPeriod");
const School = require("../models/School");

/**
 * app.js에서 app.use('/api/school-periods', schoolPeriodRoutes)
 * 최종 엔드포인트:
 *   GET    /api/school-periods           (?schoolId=)
 *   POST   /api/school-periods
 *   PUT    /api/school-periods/:id
 *   DELETE /api/school-periods/:id
 */

// 목록 (schoolName 포함)
router.get("/", async (req, res) => {
  try {
    const { schoolId } = req.query;
    const where = schoolId ? { schoolId } : {};
    const periods = await SchoolPeriod.find(where)
      .populate("schoolId")
      .sort({ start: 1 })
      .lean();

    const patched = periods.map((p) => ({
      _id: p._id,
      name: p.name,
      type: p.type || "",
      start: p.start,
      end: p.end,
      note: p.note || "",
      schoolId: p.schoolId ? p.schoolId._id?.toString() : "",
      schoolName: p.schoolId ? p.schoolId.name : "",
    }));

    res.json(patched);
  } catch (e) {
    res.status(500).json({ message: "목록 조회 오류", error: String(e?.message || e) });
  }
});

// 생성
router.post("/", requireAdminOrSuper, async (req, res) => {
  try {
    const { schoolId, name, type, start, end, note } = req.body || {};
    if (!schoolId || !name || !start || !end) {
      return res.status(400).json({ message: "schoolId, name, start, end는 필수" });
    }
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "학교 없음" });

    const doc = await SchoolPeriod.create({ schoolId, name, type, start, end, note });
    res.status(201).json({
      _id: doc._id,
      schoolId: String(doc.schoolId),
      name: doc.name,
      type: doc.type || "",
      start: doc.start,
      end: doc.end,
      note: doc.note || "",
    });
  } catch (e) {
    res.status(500).json({ message: "등록 오류", error: String(e?.message || e) });
  }
});

// 수정
router.put("/:id", requireAdminOrSuper, async (req, res) => {
  try {
    const { name, type, start, end, note } = req.body || {};
    const period = await SchoolPeriod.findById(req.params.id);
    if (!period) return res.status(404).json({ message: "해당 기간 없음" });

    if (name !== undefined) period.name = name;
    if (type !== undefined) period.type = type;
    if (start !== undefined) period.start = start;
    if (end !== undefined) period.end = end;
    if (note !== undefined) period.note = note;

    await period.save();

    res.json({
      _id: period._id,
      schoolId: String(period.schoolId),
      name: period.name,
      type: period.type || "",
      start: period.start,
      end: period.end,
      note: period.note || "",
    });
  } catch (e) {
    res.status(500).json({ message: "수정 오류", error: String(e?.message || e) });
  }
});

// 삭제
router.delete("/:id", requireAdminOrSuper, async (req, res) => {
  try {
    const period = await SchoolPeriod.findById(req.params.id);
    if (!period) return res.status(404).json({ message: "해당 기간 없음" });
    await SchoolPeriod.deleteOne({ _id: req.params.id });
    res.json({ message: "삭제 완료" });
  } catch (e) {
    res.status(500).json({ message: "삭제 오류", error: String(e?.message || e) });
  }
});

module.exports = router;
