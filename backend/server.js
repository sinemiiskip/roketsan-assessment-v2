require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/content'));
app.use('/api', require('./routes/audio'));
app.use('/api', require('./routes/intray'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Endpoint bulunamadı' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'Sunucu hatası', detail: err.message }));

app.listen(PORT, () => {
  console.log(`\n🚀 Roketsan Assessment API → http://localhost:${PORT}`);
  console.log(`🔐 Auth: POST /api/auth/login`);
  console.log(`📋 Health: http://localhost:${PORT}/health\n`);
});
