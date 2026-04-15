const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Modelle der Reihe nach versuchen (Fallback-Kette)
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

// POST /api/gemini/formulierung
router.post('/formulierung', async (req, res) => {
  const { kontext, aufgabe } = req.body;

  if (!kontext || !aufgabe) {
    return res.status(400).json({ msg: 'Bitte Kontext und Aufgabe angeben.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ msg: 'KI-Dienst nicht konfiguriert (GEMINI_API_KEY fehlt).' });
  }

  const prompt = `Du bist eine Formulierungshilfe für Studierende der Sozialen Arbeit in Deutschland.

Aufgabe: ${aufgabe}

Kontext/Beschreibung: ${kontext}

Formuliere einen professionellen, fachlich korrekten Text auf Deutsch. Verwende die Fachsprache der Sozialen Arbeit. Schreibe klar, präzise und verständlich. Maximal 200 Wörter.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Gemini: Versuche Modell ${modelName}…`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`Gemini: Erfolg mit ${modelName}`);
      return res.json({ text });
    } catch (err) {
      console.error(`Gemini Fehler (${modelName}):`, err.status || '', err.message?.slice(0, 120));
      lastError = err;
      // Weiter zum nächsten Modell – jedes Modell hat eigenes Quota
    }
  }

  // Alle Modelle fehlgeschlagen
  let userMsg = 'KI-Anfrage fehlgeschlagen. Bitte später erneut versuchen.';
  if (lastError?.message?.includes('429')) {
    userMsg = 'KI-Kontingent aufgebraucht – bitte etwas warten und erneut versuchen.';
  } else if (lastError?.message?.includes('API_KEY') || lastError?.message?.includes('INVALID')) {
    userMsg = 'KI-Dienst nicht erreichbar – API-Schlüssel prüfen.';
  } else if (lastError?.message?.includes('404')) {
    userMsg = 'KI-Modell nicht verfügbar – bitte den Administrator informieren.';
  }
  res.status(500).json({ msg: userMsg });
});

module.exports = router;
