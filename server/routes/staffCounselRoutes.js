// server/routes/staffCounselRoutes.js
const express = require('express');
const router = express.Router();
const { requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/staffCounselController');

// 상담(CounselLog 기반)
router.get('/counsel', requireStaff, ctrl.listByMonth);
router.post('/counsel/upsert', requireStaff, ctrl.upsert);
router.delete('/counsel/:id', requireStaff, ctrl.remove);

module.exports = router;
