const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mathacademy_secret_key';

// 회원가입
exports.register = async (req, res) => {
  const { name, email, password, schoolId, parentPhone } = req.body; // ★ parentPhone 받음
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: 'student',
      schoolId: schoolId || null,
      parentPhone: parentPhone || "" // ★ parentPhone 저장
    });
    res.status(201).json({ message: '회원가입 성공', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: '회원가입 실패', error: err.message });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '존재하지 않는 이메일입니다.' });
    if (user.active === false) return res.status(403).json({ message: "비활성화된 계정입니다. 관리자에게 문의하세요." });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '1d' }
    );
    res.json({ message: '로그인 성공', token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: '로그인 실패', error: err.message });
  }
};