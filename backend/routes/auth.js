const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateAuthorizedUser } = require('../rules_engine');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, user }
 */
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }

  const user = validateAuthorizedUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '8h' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
  });
});

/**
 * GET /api/auth/verify
 * Header: Authorization: Bearer <token>
 */
router.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token yok' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    res.json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
});

module.exports = router;
