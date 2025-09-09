// server/routes/adminLessonRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lessonsController');

// 저장/수정(업서트)
router.post('/lessons', ctrl.createOrUpdate);

// 날짜별 목록(등원 ∪ 해당일 로그보유)
router.get('/lessons/by-date', ctrl.listByDate);

// 특정 1건 상세
router.get('/lessons/detail', ctrl.getDetail);

// 예약 대기 목록
router.get('/lessons/pending', ctrl.listPending);

// 발송
router.post('/lessons/send-one/:id', ctrl.sendOne);
router.post('/lessons/send-selected', ctrl.sendSelected);
router.post('/lessons/send-bulk', ctrl.sendBulk);

// 라우트 살아있는지 확인용
router.get('/ping', (_req, res) => res.json({ ok: true }));

module.exports = router;
