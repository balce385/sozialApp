require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

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
    .then(async () => {
      console.log('MongoDB verbunden');
      await autoSeed();
    })
    .catch(err => console.error('MongoDB Verbindungsfehler:', err.message));
}

// Datenbank automatisch befüllen, wenn sie noch leer ist oder FORCE_RESEED gesetzt
async function autoSeed() {
  try {
    const { LibraryItem } = require('./models/Research');
    const count = await LibraryItem.countDocuments();
    const forceReseed = process.env.FORCE_RESEED === 'true';

    if (count > 0 && !forceReseed) {
      console.log(`Datenbank bereits befüllt (${count} Einträge) – Seed übersprungen.`);
      return;
    }

    if (forceReseed) {
      console.log('FORCE_RESEED=true – Datenbank wird neu befüllt...');
    } else {
      console.log('Datenbank ist leer – Seed-Daten werden eingespielt...');
    }

    const { seedDatabase } = require('./seed');
    await seedDatabase();
  } catch (err) {
    console.error('Auto-Seed Fehler:', err.message);
  }
}

