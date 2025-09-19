// server/routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/schoolController');
const { requireAdminOrSuper } = require('../middleware/auth');

/**
 * app.js에서 app.use('/api/school', schoolRoutes)
 * 최종 엔드포인트:
 *   GET    /api/school
 *   POST   /api/school
 *   DELETE /api/school/:id
 */

// 목록
router.get('/', ctrl.list);

// 생성(관리자/슈퍼만)
router.post('/', requireAdminOrSuper, ctrl.create);

// 삭제(관리자/슈퍼만)
router.delete('/:id', requireAdminOrSuper, ctrl.remove);

module.exports = router;
