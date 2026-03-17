const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getAllCandidates } = require('../store/sessionStore');

// JWT doğrulama middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token gerekli' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

// GET /api/candidates — tüm adayları getir (sadece yetkili kullanıcılar)
router.get('/candidates', authMiddleware, async (req, res) => {
  try {
    const candidates = await getAllCandidates();
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(500).json({ error: 'Adaylar getirilemedi', detail: err.message });
  }
});

module.exports = router;