// server/routes/adminUserRoutes.js
const express = require('express');
const router = express.Router();
const { requireSuper, requireAdminOrSuper } = require('../middleware/auth');
const ctrl = require('../controllers/adminUserController');

// 슈퍼 전용: 전체 사용자 목록 조회
router.get('/users', requireSuper, ctrl.listUsers);

// 슈퍼 전용: 권한 변경
router.post('/users/:id/role', requireSuper, ctrl.changeRole);

// 운영/슈퍼: 활성/비활성 전환
router.post('/users/:id/activate', requireAdminOrSuper, ctrl.setActive);

module.exports = router;
