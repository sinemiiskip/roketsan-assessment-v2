require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://roaring-fudge-3e14ba.netlify.app'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/content'));
app.use('/api', require('./routes/audio'));
app.use('/api', require('./routes/intray'));
app.use('/api', require('./routes/candidates'));

app.get('/health', function(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(function(req, res) {
  res.status(404).json({ error: 'Endpoint bulunamadi' });
});

app.use(function(err, req, res, next) {
  res.status(500).json({ error: 'Sunucu hatasi', detail: err.message });
});

app.listen(PORT, function() {
  console.log('Roketsan Assessment API calisiyor: ' + PORT);
});