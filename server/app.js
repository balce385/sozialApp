const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const postRoutes     = require('./routes/posts');
const researchRoutes = require('./routes/research');
const userRoutes     = require('./routes/users');
const aiRoutes       = require('./routes/ai');
const dbRoutes       = require('./routes/databases');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate-Limiting für KI-Endpunkte (max 30 Anfragen/Minute pro IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { msg: 'Zu viele KI-Anfragen. Bitte warte eine Minute.' }
});

// Routen
app.use('/api/auth',      authRoutes);
app.use('/api/posts',     postRoutes);
app.use('/api/research',  researchRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/ai',        aiLimiter, aiRoutes);
app.use('/api/databases', dbRoutes);

// Globale Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Interner Serverfehler' });
});

module.exports = app;
