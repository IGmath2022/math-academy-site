// server/utils/reportToken.js
const jwt = require('jsonwebtoken');

const SECRET = process.env.REPORT_JWT_SECRET || (process.env.JWT_SECRET || 'mathacademy_secret_key');

function issueToken({ studentId, days = 7, ver = 1 }) {
  const expSec = Math.floor(Date.now() / 1000) + days * 24 * 3600;
  return jwt.sign({ sid: String(studentId), ver, exp: expSec }, SECRET);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = { issueToken, verifyToken };
