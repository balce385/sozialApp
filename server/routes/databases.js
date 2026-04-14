const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const auth = require('../middleware/auth');

// Gemeinsame Hilfsfunktion für externe API-Aufrufe
async function apiFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SozialApp/1.0 (sozialapp@example.com)' },
    timeout: 8000
  });
  if (!res.ok) throw new Error(`API-Fehler: ${res.status}`);
  return res.json();
}

// ── OPENALEX ──────────────────────────────────────────────────────────────
// Vollständig kostenlos, kein API-Schlüssel nötig, 200 Mio+ Werke
// GET /api/databases/openalex?q=soziale+arbeit&seite=1
router.get('/openalex', auth, async (req, res) => {
  const { q, seite = 1, filter = '' } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ msg: 'Suchbegriff fehlt' });

  // Sozialwissenschaften-Filter: Fachbereich Social Work bevorzugen
  const filterParam = filter
    ? `&filter=${encodeURIComponent(filter)}`
    : '&filter=language:de|language:en';

  const url = `https://api.openalex.org/works?search=${encodeURIComponent(q.trim())}${filterParam}&per-page=15&page=${seite}&sort=cited_by_count:desc&mailto=sozialapp@example.com`;

  try {
    const daten = await apiFetch(url);
    const ergebnisse = (daten.results || []).map(werk => ({
      id:        werk.id,
      titel:     werk.title,
      autoren:   (werk.authorships || []).map(a => a.author?.display_name).filter(Boolean).join(', '),
      jahr:      werk.publication_year,
      quelle:    werk.primary_location?.source?.display_name || '',
      doi:       werk.doi,
      oa_url:    werk.open_access?.oa_url || null,
      frei:      werk.open_access?.is_oa || false,
      zitiert:   werk.cited_by_count || 0,
      typ:       werk.type
    }));
    res.json({ gesamt: daten.meta?.count || 0, ergebnisse });
  } catch (err) {
    console.error('OpenAlex Fehler:', err.message);
    res.status(500).json({ msg: 'OpenAlex nicht erreichbar: ' + err.message });
  }
});

// ── SEMANTIC SCHOLAR ──────────────────────────────────────────────────────
// Kostenlos, kein Schlüssel für Basic-Suche nötig, 200 Mio+ Papiere
// GET /api/databases/semanticscholar?q=soziale+arbeit
router.get('/semanticscholar', auth, async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ msg: 'Suchbegriff fehlt' });

  const felder = 'paperId,title,authors,year,abstract,openAccessPdf,citationCount,externalIds';
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q.trim())}&fields=${felder}&limit=${Math.min(Number(limit), 15)}`;

  try {
    const daten = await apiFetch(url);
    const ergebnisse = (daten.data || []).map(p => ({
      id:       p.paperId,
      titel:    p.title,
      autoren:  (p.authors || []).map(a => a.name).join(', '),
      jahr:     p.year,
      abstract: p.abstract,
      doi:      p.externalIds?.DOI || null,
      pdf_url:  p.openAccessPdf?.url || null,
      zitiert:  p.citationCount || 0
    }));
    res.json({ gesamt: daten.total || ergebnisse.length, ergebnisse });
  } catch (err) {
    console.error('Semantic Scholar Fehler:', err.message);
    res.status(500).json({ msg: 'Semantic Scholar nicht erreichbar: ' + err.message });
  }
});

// ── CROSSREF (DOI-Auflösung & Suche) ─────────────────────────────────────
// Vollständig kostenlos, kein Schlüssel nötig
// GET /api/databases/crossref?q=methoden+soziale+arbeit
router.get('/crossref', auth, async (req, res) => {
  const { q, rows = 10 } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ msg: 'Suchbegriff fehlt' });

  const url = `https://api.crossref.org/works?query=${encodeURIComponent(q.trim())}&rows=${Math.min(Number(rows), 15)}&select=DOI,title,author,published,container-title,type,link&mailto=sozialapp@example.com`;

  try {
    const daten = await apiFetch(url);
    const ergebnisse = (daten.message?.items || []).map(werk => ({
      doi:     werk.DOI,
      titel:   Array.isArray(werk.title) ? werk.title[0] : werk.title,
      autoren: (werk.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(', '),
      jahr:    werk.published?.['date-parts']?.[0]?.[0],
      journal: Array.isArray(werk['container-title']) ? werk['container-title'][0] : '',
      typ:     werk.type,
      url:     werk.link?.[0]?.URL || `https://doi.org/${werk.DOI}`
    }));
    res.json({ gesamt: daten.message?.['total-results'] || 0, ergebnisse });
  } catch (err) {
    console.error('CrossRef Fehler:', err.message);
    res.status(500).json({ msg: 'CrossRef nicht erreichbar: ' + err.message });
  }
});

// ── SSOAR (Social Science Open Access Repository) ────────────────────────
// Kostenlos, deutschsprachiger Fokus, Sozialwissenschaften
// GET /api/databases/ssoar?q=soziale+arbeit
router.get('/ssoar', auth, async (req, res) => {
  const { q, start = 0 } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ msg: 'Suchbegriff fehlt' });

  const url = `https://www.ssoar.info/ssoar/oai?verb=GetRecord&metadataPrefix=oai_dc&q=${encodeURIComponent(q.trim())}&rows=10&start=${start}`;

  // SSOAR via OAI-PMH ist komplex – wir leiten zur Suchergebnisseite weiter
  // und geben stattdessen einen direkten Suchlink zurück
  const suchUrl = `https://www.ssoar.info/ssoar/discover?query=${encodeURIComponent(q.trim())}&rpp=10&start=${start}`;
  res.json({
    hinweis: 'SSOAR unterstützt keine direkte API-Integration. Nutze den Suchlink.',
    suchUrl,
    ergebnisse: []
  });
});

// ── KURATIERTE DATENBANKEN (statische Liste) ─────────────────────────────
// GET /api/databases/liste
router.get('/liste', auth, (req, res) => {
  res.json([
    {
      name:        'OpenAlex',
      url:         'https://openalex.org',
      beschreibung: 'Kostenlos, 200 Mio+ Werke, alle Disziplinen. Beste Allround-Datenbank.',
      fokus:       'Interdisziplinär',
      sprache:     'DE/EN',
      kostenlos:   true,
      api:         true,
      tipp:        'Suchbegriffe: "social work", "Soziale Arbeit", SGB VIII'
    },
    {
      name:        'SSOAR',
      url:         'https://www.ssoar.info',
      beschreibung: 'Social Science Open Access Repository – deutschsprachiger Fokus auf Sozialwissenschaften.',
      fokus:       'Sozialwissenschaften (DE)',
      sprache:     'DE/EN',
      kostenlos:   true,
      api:         false,
      tipp:        'Ideal für deutschsprachige Fachzeitschriften'
    },
    {
      name:        'BASE',
      url:         'https://www.base-search.net',
      beschreibung: 'Bielefeld Academic Search Engine – 350 Mio+ Dokumente, Open Access.',
      fokus:       'Open Access, alle Disziplinen',
      sprache:     'DE/EN',
      kostenlos:   true,
      api:         false,
      tipp:        'Filter "Open Access" aktivieren für freie Volltexte'
    },
    {
      name:        'Semantic Scholar',
      url:         'https://www.semanticscholar.org',
      beschreibung: 'KI-gestützte Literatursuche, 200 Mio+ Papiere mit Zitationsgraph.',
      fokus:       'Wissenschaftliche Paper',
      sprache:     'EN',
      kostenlos:   true,
      api:         true,
      tipp:        'Nutze "Highly Cited" Filter für Standardwerke'
    },
    {
      name:        'DOAJ',
      url:         'https://doaj.org',
      beschreibung: 'Directory of Open Access Journals – nur peer-reviewed Open Access Journals.',
      fokus:       'Open Access Journals',
      sprache:     'DE/EN',
      kostenlos:   true,
      api:         false,
      tipp:        'Suche nach Journal "Soziale Arbeit" oder "social work"'
    },
    {
      name:        'DZI SoLit',
      url:         'https://www.dzi.de/informationsdienstleistungen/dzi-solit/',
      beschreibung: 'Deutsches Zentralinstitut – Literaturdatenbank Soziale Arbeit (kostenpflichtig über Hochschule).',
      fokus:       'Soziale Arbeit (DE)',
      sprache:     'DE',
      kostenlos:   false,
      hochschule:  true,
      api:         false,
      tipp:        'Über Hochschulbibliothek kostenlos zugänglich'
    },
    {
      name:        'FIS Bildung',
      url:         'https://www.fis-bildung.de',
      beschreibung: 'Fachinformationssystem Bildung – Literatur zu Erziehung, Bildung und Soziale Arbeit.',
      fokus:       'Bildung & Erziehung (DE)',
      sprache:     'DE',
      kostenlos:   true,
      api:         false,
      tipp:        'Ideal für Kinder- und Jugendhilfe Themen'
    },
    {
      name:        'socialnet Literaturtipps',
      url:         'https://www.socialnet.de/literatur/',
      beschreibung: 'Fachliteratur-Rezensionen zur Sozialen Arbeit, kuratiert von Expert*innen.',
      fokus:       'Soziale Arbeit (DE)',
      sprache:     'DE',
      kostenlos:   true,
      api:         false,
      tipp:        'Sehr gut für Standardwerke und aktuelle Neuerscheinungen'
    },
    {
      name:        'CrossRef',
      url:         'https://search.crossref.org',
      beschreibung: 'DOI-Auflösung und Metadatensuche für 140 Mio+ Werke.',
      fokus:       'Metadaten & DOI',
      sprache:     'DE/EN',
      kostenlos:   true,
      api:         true,
      tipp:        'Ideal zum Verifizieren von DOIs und Zitationsangaben'
    },
    {
      name:        'Bundeszentrale für politische Bildung',
      url:         'https://www.bpb.de/themen/soziale-lage/',
      beschreibung: 'Kostenlose Publikationen zu sozialen Themen, Armut, Migration, Bildung.',
      fokus:       'Sozialpolitik (DE)',
      sprache:     'DE',
      kostenlos:   true,
      api:         false,
      tipp:        'Exzellent für sozialpolitische Hintergrundinformationen'
    }
  ]);
});

module.exports = router;
