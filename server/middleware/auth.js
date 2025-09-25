// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mathacademy_secret_key';

/**
 * Common auth middleware: expects Authorization: Bearer <token>
 * token payload: { id, email, role }
 */
exports.isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authentication required' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/** Allow admin or super roles (backward-compatible helper) */
exports.isAdmin = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (!['admin', 'super'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin permission required' });
    }
    next();
  });
};

/** Super-only middleware */
exports.requireSuper = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (req.user.role !== 'super') {
      return res.status(403).json({ message: 'Super admin only' });
    }
    next();
  });
};

/** Allow admin or super */
exports.requireAdminOrSuper = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (!['admin', 'super'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin or super permission required' });
    }
    next();
  });
};

/** Teacher only */
exports.requireTeacher = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher permission required' });
    }
    next();
  });
};

/** Staff: admin | super | teacher */
exports.requireStaff = (req, res, next) => {
  exports.isAuthenticated(req, res, () => {
    if (!['admin', 'super', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Staff permission required' });
    }
    next();
  });
};
