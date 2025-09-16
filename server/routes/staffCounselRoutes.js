// server/routes/staffCounselRoutes.js
const express = require('express');
const router = express.Router();
const { requireStaff } = require('../middleware/auth'); // admin | super | teacher
const ctrl = require('../controllers/staffCounselController');

/**
 * app.js 에서 app.use('/api/staff', staffCounselRoutes)
 * 실제 엔드포인트: /api/staff/counsel
 */
router.get('/counsel', requireStaff, ctrl.listByMonth);
router.post('/counsel', requireStaff, ctrl.upsert);
router.delete('/counsel/:id', requireStaff, ctrl.remove);

module.exports = router;
