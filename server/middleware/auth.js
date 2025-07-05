const jwt = require('jsonwebtoken');
const SECRET = 'mathacademy_secret_key'; // authController와 동일하게

exports.isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: '토큰 없음' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: '유효하지 않은 토큰' });
  }
};

exports.isAdmin = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근 가능' });
    }
    next();
  });
};