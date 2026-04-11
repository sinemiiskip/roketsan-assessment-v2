require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
// ── CORS from environment variable (no hardcoded URLs) ───────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Rate limiting ─────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Çok fazla istek. Lütfen bekleyin.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI isteği limiti aşıldı. Lütfen bekleyin.' }
});

app.use(generalLimiter);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/session'));
app.use('/api', aiLimiter, require('./routes/content'));
app.use('/api', aiLimiter, require('./routes/audio'));
app.use('/api', require('./routes/intray'));
app.use('/api', require('./routes/candidates'));

// ── Health check ──────────────────────────────────────────────────
app.get('/health', function(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use(function(req, res) {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// ── Error handler ─────────────────────────────────────────────────
app.use(function(err, req, res, next) {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Sunucu hatası', detail: err.message });
});

app.listen(PORT, function() {
  console.log('Roketsan Assessment API çalışıyor: ' + PORT);
});