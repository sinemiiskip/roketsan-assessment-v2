require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
// Handle preflight for ALL routes explicitly
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.status(200).end();
});
const PORT = process.env.PORT || 3001;

// ── CORS — must be absolute first
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// ── Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Çok fazla istek.' },
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'AI isteği limiti aşıldı.' },
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/session'));
app.use('/api', aiLimiter, require('./routes/content'));
app.use('/api', aiLimiter, require('./routes/audio'));
app.use('/api', require('./routes/intray'));
app.use('/api', require('./routes/candidates'));

// ── Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ── 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// ── Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Sunucu hatası', detail: err.message });
});

app.listen(PORT, () => {
  console.log('Roketsan Assessment API çalışıyor: ' + PORT);
});