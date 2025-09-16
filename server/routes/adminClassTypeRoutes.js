// server/routes/adminClassTypeRoutes.js
const express = require('express');
const router = express.Router();
const { requireAdminOrSuper } = require('../middleware/auth');
const ctrl = require('../controllers/adminClassTypeController');

/**
 * app.js에서 app.use('/api/admin', adminClassTypeRoutes)
 * 최종 엔드포인트: /api/admin/class-types/*
 * - 관리자/슈퍼만 접근 가능
 */

router.get('/class-types', requireAdminOrSuper, ctrl.list);
router.post('/class-types', requireAdminOrSuper, ctrl.create);
router.put('/class-types/:id', requireAdminOrSuper, ctrl.update);
router.delete('/class-types/:id', requireAdminOrSuper, ctrl.remove);
router.patch('/class-types/:id/toggle', requireAdminOrSuper, ctrl.toggle);

module.exports = router;
