const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// 회원가입, 로그인 컨트롤러 사용
router.post('/register', auth.register);
router.post('/login', auth.login);

module.exports = router;