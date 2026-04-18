require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS — absolute first, catches everything including rate limit responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));

// ── Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { error: 'Çok fazla istek.' },
  skip: (req) => req.method === 'OPTIONS'
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 15,
  message: { error: 'AI isteği limiti aşıldı.' },
  skip: (req) => req.method === 'OPTIONS'
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

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' }));

app.use((req, res) => res.status(404).json({ error: 'Endpoint bulunamadı' }));
app.use((err, req, res, next) => { console.error('[ERROR]', err.message); res.status(500).json({ error: 'Sunucu hatası', detail: err.message }); });

app.listen(PORT, () => console.log('Roketsan Assessment API çalışıyor: ' + PORT));