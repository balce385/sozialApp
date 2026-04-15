const express = require('express');
const router = express.Router();

// Modelle der Reihe nach versuchen (v1beta REST-API – breiteste Modell-Unterstützung)
const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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

  let lastError = null;
  let hadQuotaError = false;

  for (const modelName of MODELS) {
    try {
      console.log(`Gemini: Versuche Modell ${modelName}…`);

      const response = await fetch(
        `${GEMINI_BASE}/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 600 }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error?.message || `HTTP ${response.status}`;
        console.error(`Gemini Fehler (${modelName}): ${response.status} – ${errMsg.slice(0, 150)}`);
        if (response.status === 429) hadQuotaError = true;
        lastError = { status: response.status, message: errMsg };
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error(`Gemini (${modelName}): Leere Antwort`);
        lastError = { status: 200, message: 'Leere Antwort' };
        continue;
      }

      console.log(`Gemini: Erfolg mit ${modelName}`);
      return res.json({ text });

    } catch (err) {
      console.error(`Gemini Netzwerkfehler (${modelName}):`, err.message?.slice(0, 120));
      lastError = { status: 0, message: err.message };
    }
  }

  // Alle Modelle fehlgeschlagen – aussagekräftige Fehlermeldung
  let userMsg = 'KI-Anfrage fehlgeschlagen. Bitte später erneut versuchen.';
  if (hadQuotaError) {
    userMsg = 'KI-Kontingent aufgebraucht – bitte etwas warten und erneut versuchen.';
  } else if (lastError?.message?.includes('API_KEY') || lastError?.message?.includes('INVALID') || lastError?.status === 400) {
    userMsg = 'KI-Dienst nicht erreichbar – API-Schlüssel prüfen.';
  }
  res.status(500).json({ msg: userMsg });
});

module.exports = router;
