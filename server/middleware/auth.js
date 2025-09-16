// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mathacademy_secret_key';

/**
 * 공통 인증: Authorization: Bearer <token>
 * payload: { id, email, role }
 */
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

/** (레거시) 관리자만 — super는 제외 */
exports.isAdmin = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근 가능' });
    }
    next();
  });
};

/** 슈퍼 전용 */
exports.requireSuper = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (req.user.role !== 'super') {
      return res.status(403).json({ message: '슈퍼관리자만 접근 가능' });
    }
    next();
  });
};

/** 운영자 또는 슈퍼 */
exports.requireAdminOrSuper = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (!['admin', 'super'].includes(req.user.role)) {
      return res.status(403).json({ message: '운영자/슈퍼만 접근 가능' });
    }
    next();
  });
};

/** 강사 전용 */
exports.requireTeacher = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '강사만 접근 가능' });
    }
    next();
  });
};

/** 스태프 공통(admin | super | teacher) */
exports.requireStaff = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (!['admin', 'super', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: '스태프만 접근 가능' });
    }
    next();
  });
};
