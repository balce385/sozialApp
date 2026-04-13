const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const auth = require('../middleware/auth');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// System-Prompt wird für alle Anfragen gecacht (spart Token-Kosten)
const SYSTEM_PROMPT = `Du bist ein akademischer Assistent, spezialisiert auf Soziale Arbeit (Social Work).
Du unterstützt Studierende der Sozialen Arbeit in Deutschland bei ihrer akademischen Arbeit.

Dein Fachwissen umfasst:
- Methoden der Sozialen Arbeit (Einzelfallhilfe, Gruppenarbeit, Gemeinwesenarbeit)
- Rechtliche Grundlagen (SGB II, VIII, XII, Jugendschutzgesetz, KJSG)
- Handlungsfelder: Kinder- & Jugendhilfe, Sozialhilfe, Suchtberatung, Flüchtlingshilfe, Altenbetreuung, Schuldnerberatung
- Ethik der Sozialen Arbeit (IFSW-Definition, DBSH-Ethikkodex)
- Wissenschaftliches Schreiben und akademischer Stil auf Deutsch
- Fachterminologie der Sozialen Arbeit

Regeln:
- Antworte immer auf Deutsch, es sei denn, es wird explizit eine andere Sprache verlangt
- Schreibe professionell, klar und präzise
- Beachte stets den Datenschutz: keine realen Personendaten verwenden
- Bei ethisch kritischen Anfragen auf professionelle Grenzen hinweisen
- Verwende korrekte Fachbegriffe der Sozialen Arbeit`;

// ── FORMULIERUNGSHILFE ─────────────────────────────────────────────────────
// POST /api/ai/formulierung
// Body: { text: string, modus: 'verbessern'|'umformulieren'|'kuerzen'|'erweitern'|'korrektorat' }
router.post('/formulierung', auth, async (req, res) => {
  const { text, modus = 'verbessern' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ msg: 'Text ist erforderlich' });
  }
  if (text.length > 3000) {
    return res.status(400).json({ msg: 'Text zu lang (max. 3000 Zeichen)' });
  }

  const anweisungen = {
    verbessern:    'Verbessere den folgenden Text sprachlich und stilistisch für akademisches Schreiben. Behalte den Inhalt bei:',
    umformulieren: 'Formuliere den folgenden Text vollständig um (anderer Ausdruck, gleicher Sinn, akademischer Stil):',
    kuerzen:       'Kürze den folgenden Text auf das Wesentliche. Behalte alle wichtigen Aussagen:',
    erweitern:     'Erweitere den folgenden Text mit fachlich fundierten Inhalten und Fachbegriffen der Sozialen Arbeit:',
    korrektorat:   'Korrigiere den folgenden Text: Grammatik, Rechtschreibung, Zeichensetzung und akademischer Stil:'
  };

  const anweisung = anweisungen[modus] || anweisungen.verbessern;

  try {
    const nachricht = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `${anweisung}\n\n---\n${text.trim()}\n---\n\nGib nur den überarbeiteten Text zurück, ohne Erklärungen.` }]
    });

    res.json({ ergebnis: nachricht.content[0].text });
  } catch (err) {
    console.error('Claude API Fehler:', err.message);
    res.status(500).json({ msg: 'KI-Fehler: ' + err.message });
  }
});

// ── FALLANALYSE ────────────────────────────────────────────────────────────
// POST /api/ai/fallanalyse
// Body: { name, bereich, situation, hintergrund, ziele }
router.post('/fallanalyse', auth, async (req, res) => {
  const { name, bereich, situation, hintergrund, ziele } = req.body;

  if (!name || !bereich || !situation || !ziele) {
    return res.status(400).json({ msg: 'Name, Bereich, Situation und Ziele sind erforderlich' });
  }

  const prompt = `Erstelle eine strukturierte, professionelle Fallanalyse für den folgenden Sozialarbeitsfall:

**Klient/Fall:** ${name}
**Arbeitsfeld:** ${bereich}
**Ausgangssituation:** ${situation}
**Hintergrund / Vorgeschichte:** ${hintergrund || 'Nicht angegeben'}
**Interventionsziele:** ${ziele}

Strukturiere deine Analyse wie folgt:

## 1. Problemanalyse
Beschreibe die zentralen Probleme und ihre Zusammenhänge.

## 2. Ressourcenanalyse
Welche Stärken und Ressourcen (persönlich, sozial, strukturell) sind vorhanden?

## 3. Empfohlene Interventionen
Konkrete Maßnahmen mit fachlicher Begründung.

## 4. Kooperationspartner
Welche Einrichtungen, Behörden oder Fachkräfte sollten einbezogen werden?

## 5. Rechtliche Grundlagen
Relevante Gesetze und Paragraphen (SGB, KJSG etc.).

## 6. Nächste Schritte
Priorisierte Handlungsschritte für den Einstieg.`;

  try {
    const nachricht = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ analyse: nachricht.content[0].text });
  } catch (err) {
    console.error('Claude API Fehler:', err.message);
    res.status(500).json({ msg: 'KI-Fehler: ' + err.message });
  }
});

// ── RECHERCHEHILFE ─────────────────────────────────────────────────────────
// POST /api/ai/recherche
// Body: { frage, kontext?, sprache? }
router.post('/recherche', auth, async (req, res) => {
  const { frage, kontext, sprache = 'de' } = req.body;

  if (!frage || !frage.trim()) {
    return res.status(400).json({ msg: 'Eine Frage ist erforderlich' });
  }

  const prompt = `Beantworte folgende Recherchefrage aus dem Bereich Soziale Arbeit:

**Frage:** ${frage.trim()}
**Thematischer Kontext:** ${kontext || 'Allgemeine Soziale Arbeit'}

Strukturiere deine Antwort:

## Kernaussagen
Prägnante Antwort auf die Frage.

## Fachlicher Hintergrund
Relevante Theorie, Konzepte und Definitionen.

## Wichtige Fachbegriffe
Schlüsselbegriffe für die weitere Recherche.

## Empfohlene Quellen & Datenbanken
Konkrete Empfehlungen wo und wie weiterrecherchieren (kostenlose Datenbanken bevorzugen: SSOAR, OpenAlex, BASE, DOAJ, DZI SoLit).`;

  try {
    const nachricht = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ antwort: nachricht.content[0].text });
  } catch (err) {
    console.error('Claude API Fehler:', err.message);
    res.status(500).json({ msg: 'KI-Fehler: ' + err.message });
  }
});

// ── FREIER CHAT ─────────────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { nachricht: string, verlauf?: [{role, content}] }
router.post('/chat', auth, async (req, res) => {
  const { nachricht, verlauf = [] } = req.body;

  if (!nachricht || !nachricht.trim()) {
    return res.status(400).json({ msg: 'Nachricht ist erforderlich' });
  }
  if (verlauf.length > 20) {
    return res.status(400).json({ msg: 'Gesprächsverlauf zu lang (max. 20 Nachrichten)' });
  }

  const nachrichten = [
    ...verlauf.map(v => ({ role: v.role, content: v.content })),
    { role: 'user', content: nachricht.trim() }
  ];

  try {
    const antwort = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: nachrichten
    });

    res.json({ antwort: antwort.content[0].text });
  } catch (err) {
    console.error('Claude API Fehler:', err.message);
    res.status(500).json({ msg: 'KI-Fehler: ' + err.message });
  }
});

module.exports = router;
