const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/gemini/formulierung
// Formulierungshilfe mit Google Gemini (kostenlose Tier)
router.post('/formulierung', async (req, res) => {
  const { kontext, aufgabe } = req.body;

  if (!kontext || !aufgabe) {
    return res.status(400).json({ msg: 'Bitte Kontext und Aufgabe angeben.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ msg: 'KI-Dienst nicht konfiguriert (GEMINI_API_KEY fehlt).' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Du bist eine Formulierungshilfe für Studierende der Sozialen Arbeit in Deutschland.

Aufgabe: ${aufgabe}

Kontext/Beschreibung: ${kontext}

Formuliere einen professionellen, fachlich korrekten Text auf Deutsch. Verwende die Fachsprache der Sozialen Arbeit. Schreibe klar, präzise und verständlich. Maximal 200 Wörter.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ text });
  } catch (err) {
    console.error('Gemini Fehler:', err.message);
    let userMsg = 'KI-Anfrage fehlgeschlagen. Bitte später erneut versuchen.';
    if (err.message && err.message.includes('429')) {
      userMsg = 'KI-Kontingent aufgebraucht – bitte etwas warten und erneut versuchen.';
    } else if (err.message && err.message.includes('API_KEY')) {
      userMsg = 'KI-Dienst nicht konfiguriert (API-Schlüssel fehlt oder ungültig).';
    }
    res.status(500).json({ msg: userMsg });
  }
});

module.exports = router;
