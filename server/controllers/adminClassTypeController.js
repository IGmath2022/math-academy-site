// server/controllers/adminClassTypeController.js
const ClassType = require('../models/ClassType');

exports.list = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active === '1' || active === 'true') filter.active = true;
    const list = await ClassType.find(filter).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'failed to list class types' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await ClassType.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: 'invalid id' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, active } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ message: 'name is required' });

    const doc = await ClassType.create({
      name: name.trim(),
      description: description || '',
      active: typeof active === 'boolean' ? active : true,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e?.message || 'failed to create class type' });
  }
};

exports.update = async (req, res) => {
  try {
    const update = {};
    if ('name' in req.body) update.name = String(req.body.name || '').trim();
    if ('description' in req.body) update.description = req.body.description || '';
    if ('active' in req.body) update.active = !!req.body.active;

    const doc = await ClassType.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e?.message || 'failed to update class type' });
  }
};

exports.remove = async (req, res) => {
  try {
    const r = await ClassType.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e?.message || 'failed to delete class type' });
  }
};
