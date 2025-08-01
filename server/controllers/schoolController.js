const School = require('../models/School');

exports.list = async (req, res) => {
  const schools = await School.find().sort({ name: 1 });
  res.json(schools);
};

exports.create = async (req, res) => {
  const { name, region } = req.body;
  if (!name) return res.status(400).json({ message: "학교명 필수" });
  try {
    const school = await School.create({ name, region });
    res.status(201).json(school);
  } catch (err) {
    res.status(500).json({ message: "학교 등록 실패", error: err.message });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const school = await School.findById(id);
  if (!school) return res.status(404).json({ message: "학교 없음" });
  await School.deleteOne({ _id: id });
  res.json({ message: "삭제 완료" });
};