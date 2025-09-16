// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mathacademy_secret_key';

function verifyToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

exports.isAuthenticated = (req, res, next) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ message: '토큰 없음 또는 유효하지 않음' });
  req.user = decoded;
  next();
};

// 🔒 기존 라우트 호환: admin 또는 super 허용
exports.isAdmin = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'super') {
      return res.status(403).json({ message: '관리자 전용' });
    }
    next();
  });
};

/* =========================
 * RBAC 유틸리티
 * ========================= */
function allowRoles(roles = []) {
  return (req, res, next) => {
    exports.isAuthenticated(req, res, () => {
      const role = req.user?.role;
      if (!roles.includes(role)) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }
      next();
    });
  };
}

exports.requireSuper = allowRoles(['super']);
exports.requireAdminOrSuper = allowRoles(['admin', 'super']);
exports.requireTeacher = allowRoles(['teacher']);
exports.requireStaff = allowRoles(['teacher', 'admin', 'super']); // 강사/운영/슈퍼
exports.requireStudent = allowRoles(['student']);

/**
 * 자신(학생 본인) 혹은 스태프만 접근 허용
 * - getUserId: 요청에서 사용자 id를 추출하는 함수(req -> userId)
 */
exports.requireSelfOrStaff = (getUserId) => (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    const me = String(req.user?.id || '');
    const role = req.user?.role;
    const target = String(getUserId(req) || '');
    if (['teacher', 'admin', 'super'].includes(role) || (me && target && me === target)) {
      return next();
    }
    return res.status(403).json({ message: '권한이 없습니다.' });
  });
};
