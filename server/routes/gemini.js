const express = require('express');
const router = express.Router();

// ==========================================
// KI-Provider Hilfsfunktionen (Fallback-Kette)
// ==========================================

// 1. Google Gemini (v1beta REST-API)
async function tryGemini(prompt, apiKey) {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash'];
  const base = 'https://generativelanguage.googleapis.com/v1beta/models';

  for (const model of models) {
    try {
      const res = await fetch(`${base}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600 }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`Gemini ${model}: ${res.status} – ${(data.error?.message || '').slice(0, 100)}`);
        continue;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { console.log(`Gemini: Erfolg mit ${model}`); return text; }
    } catch (err) {
      console.error(`Gemini ${model} Netzwerkfehler:`, err.message?.slice(0, 80));
    }
  }
  return null;
}

// 2. Groq – llama-3.1-8b-instant (kostenlos: 14.400 Anfragen/Tag)
// API-Schlüssel: https://console.groq.com → GROQ_API_KEY in Render setzen
async function tryGroq(prompt, apiKey) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`Groq: ${res.status} – ${(data.error?.message || '').slice(0, 100)}`);
      return null;
    }
    const text = data.choices?.[0]?.message?.content;
    if (text) { console.log('Groq: Erfolg'); return text; }
  } catch (err) {
    console.error('Groq Netzwerkfehler:', err.message?.slice(0, 80));
  }
  return null;
}

// 3. Pollinations.ai – kein API-Schlüssel erforderlich, immer verfügbar
async function tryPollinations(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai',
        seed: Date.now() % 9999
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) { console.error(`Pollinations: HTTP ${res.status}`); return null; }
    const text = await res.text();
    if (text?.trim()) { console.log('Pollinations: Erfolg'); return text.trim(); }
  } catch (err) {
    clearTimeout(timeout);
    console.error('Pollinations Fehler:', err.name === 'AbortError' ? 'Timeout (28s)' : err.message?.slice(0, 80));
  }
  return null;
}

// ==========================================
// POST /api/gemini/formulierung
// ==========================================
router.post('/formulierung', async (req, res) => {
  const { kontext, aufgabe } = req.body;

  if (!kontext || !aufgabe) {
    return res.status(400).json({ msg: 'Bitte Kontext und Aufgabe angeben.' });
  }

  const prompt = `Du bist eine Formulierungshilfe für Studierende der Sozialen Arbeit in Deutschland.

Aufgabe: ${aufgabe}

Kontext/Beschreibung: ${kontext}

Formuliere einen professionellen, fachlich korrekten Text auf Deutsch. Verwende die Fachsprache der Sozialen Arbeit. Schreibe klar, präzise und verständlich. Maximal 200 Wörter.`;

  // 1. Versuch: Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const text = await tryGemini(prompt, geminiKey);
    if (text) return res.json({ text });
    console.log('Gemini: Alle Modelle fehlgeschlagen – wechsle zu Groq');
  }

  // 2. Versuch: Groq (llama-3.1-8b-instant)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const text = await tryGroq(prompt, groqKey);
    if (text) return res.json({ text });
    console.log('Groq: Fehlgeschlagen – wechsle zu Pollinations');
  }

  // 3. Versuch: Pollinations.ai (kein Schlüssel nötig)
  console.log('Pollinations: Letzter Versuch…');
  const text = await tryPollinations(prompt);
  if (text) return res.json({ text });

  // Alle Provider fehlgeschlagen
  console.error('Alle KI-Provider fehlgeschlagen');
  res.status(500).json({ msg: 'KI-Dienst vorübergehend nicht verfügbar – bitte kurz warten und erneut versuchen.' });
});

module.exports = router;
