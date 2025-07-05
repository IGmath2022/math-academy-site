const { User } = require("../models");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = 'mathacademy_secret_key'; // 더 안전하게 바꿔도 OK

exports.register = async (req, res) => {
  const { name, email, password, schoolId } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: 'student',
      schoolId: schoolId || null });
    res.status(201).json({ message: '회원가입 성공', userId: user.id });
  } catch (err) {
    res.status(500).json({ message: '회원가입 실패', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: '존재하지 않는 이메일입니다.' });
    if (!user.active) return res.status(403).json({ message: "비활성화된 계정입니다. 관리자에게 문의하세요." });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '1d' }
    );
    res.json({ message: '로그인 성공', token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: '로그인 실패', error: err.message });
  }
};