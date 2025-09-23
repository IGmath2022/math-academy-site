// server/routes/adminClassTypeRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminClassTypeController');
// const { requireAdminOrSuper } = require('../middleware/auth');

// 목록
router.get('/', /* requireAdminOrSuper, */ ctrl.list);
// 단건
router.get('/:id', /* requireAdminOrSuper, */ ctrl.getOne);
// 생성
router.post('/', /* requireAdminOrSuper, */ ctrl.create);
// 수정
router.put('/:id', /* requireAdminOrSuper, */ ctrl.update);
// 삭제
router.delete('/:id', /* requireAdminOrSuper, */ ctrl.remove);

module.exports = router;
