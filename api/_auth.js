// ============================================================================
// Studyling Auth Helpers (api/_auth.js) - Production Ready
// Password Hashing (bcrypt) & JWT Token Verification
// ============================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

function sanitizeSecret(val) {
  if (!val) return 'studyling_production_jwt_secret_2025_safe';
  let clean = String(val).trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean || 'studyling_production_jwt_secret_2025_safe';
}

const JWT_SECRET = sanitizeSecret(process.env.JWT_SECRET);

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      role: user.role || 'student'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function extractToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

function getAuthenticatedUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 10);
}

async function comparePassword(plainPassword, hash) {
  if (!plainPassword || !hash) return false;
  return await bcrypt.compare(plainPassword, hash);
}

module.exports = {
  signToken,
  verifyToken,
  getAuthenticatedUser,
  hashPassword,
  comparePassword,
  JWT_SECRET_CONFIGURED: !!process.env.JWT_SECRET
};
