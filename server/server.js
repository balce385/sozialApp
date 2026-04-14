require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Frontend-Dateien ausliefern (nur lokal relevant; auf Render kommt alles von IONOS)
app.use(require('express').static(path.join(__dirname, '../client')));

// Server ZUERST starten – unabhängig von der DB-Verbindung
app.listen(PORT, HOST, () => {
  console.log(`Server läuft auf ${HOST}:${PORT}`);
});

// Datenbankverbindung – Fehler crashen den Server NICHT
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('FEHLER: MONGODB_URI ist nicht gesetzt! Bitte in Render unter Environment eintragen.');
} else {
  mongoose.connect(uri)
    .then(() => console.log('MongoDB verbunden'))
    .catch(err => console.error('MongoDB Verbindungsfehler:', err.message));
}
