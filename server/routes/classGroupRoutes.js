// server/routes/classGroupRoutes.js
const express = require('express');
const router = express.Router();
const { requireAdminOrSuper, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/classGroupController');

// ADMIN/SUPER
router.get('/classes', requireAdminOrSuper, ctrl.list);
router.post('/classes', requireAdminOrSuper, ctrl.create);
router.post('/classes/:id', requireAdminOrSuper, ctrl.update);
router.post('/classes/:id/assign', requireAdminOrSuper, ctrl.assign);

// STAFF
router.get('/classes/mine', requireStaff, ctrl.myGroups);
router.get('/metrics/workload', requireStaff, ctrl.myWorkload);

module.exports = router;
