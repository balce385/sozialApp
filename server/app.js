const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const researchRoutes = require('./routes/research');
const userRoutes = require('./routes/users');

const app = express();

// CORS: alle Origins erlauben (iOS Safari Preflight-kompatibel)
app.use(cors());
app.options('*', cors());
app.use(express.json());

// Health-Check für Render (verhindert Cold-Start-Timeout)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/users', userRoutes);

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Etwas ist schiefgelaufen!');
});

module.exports = app;
