require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const app = require('./app');

// IONOS stellt PORT als Umgebungsvariable bereit
const PORT = process.env.PORT || 5000;
// 0.0.0.0 bindet an alle Netzwerkinterfaces (notwendig bei IONOS)
const HOST = '0.0.0.0';

// Frontend-Dateien aus client/ ausliefern (gleicher Origin → kein CORS-Problem)
app.use(require('express').static(path.join(__dirname, '../client')));

// Datenbankverbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// Server starten
app.listen(PORT, HOST, () => {
  console.log(`Server läuft auf ${HOST}:${PORT}`);
});
