// Globale Variablen
let currentCardIndex = 0;
let cardFlipped = false;
let timerInterval = null;
let timerMinutes = 25;
let timerSeconds = 0;
let timerRunning = false;
let allCards = [];

// API Base URL: liest aus config.js (BACKEND_URL = Render-URL), sonst relativ
const API_URL = (window.BACKEND_URL || '') + '/api';

// DOM Elemente
const libraryResults = document.getElementById('library-results');
const caseResults = document.getElementById('case-results');
const flashcard = document.getElementById('flashcard-inner');
const cardQuestion = document.getElementById('card-question');
const cardAnswer = document.getElementById('card-answer');
const cardCounter = document.getElementById('card-counter');
const timerDisplay = document.getElementById('timer-display');
const groupsContainer = document.getElementById('groups-container');
const mentorsContainer = document.getElementById('mentors-container');
const resourcesGrid = document.getElementById('resources-grid');

// Bibliothek durchsuchen
async function searchLibrary() {
  const searchTerm = document.getElementById('lib-search').value;
  const activeBtn = document.querySelector('.filter-btn.active');
  const category = activeBtn ? activeBtn.dataset.category : 'all';

  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (category && category !== 'all') params.append('category', category);

    const response = await fetch(`${API_URL}/research/library?${params.toString()}`);
    const items = await response.json();

    if (!response.ok) {
      throw new Error(items.msg || 'Bibliotheksdaten konnten nicht geladen werden');
    }

    renderLibraryItems(items);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Bibliothekselemente rendern
function renderLibraryItems(items) {
  libraryResults.innerHTML = items.length === 0
    ? '<p style="text-align:center;color:#888;padding:20px">Keine Einträge gefunden</p>'
    : items.map(item => `
      <div class="library-card">
        <h3>${item.title}</h3>
        <p><strong>Autor:</strong> ${item.author} (${item.year})</p>
        <p><strong>Verlag:</strong> ${item.publisher}</p>
        <p><strong>Kategorie:</strong> ${getCategoryName(item.category)}</p>
        <p>${item.description}</p>
        <p><small>${item.pages} Seiten</small></p>
        <div class="library-links">
          ${item.freeLink ? `<a href="${item.freeLink}" target="_blank" rel="noopener noreferrer" class="lib-btn lib-btn-free">📖 Kostenlos lesen</a>` : ''}
          ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="lib-btn lib-btn-info">ℹ️ Infos & Kauf</a>` : ''}
        </div>
      </div>
    `).join('');
}

// Kategorie-Name abrufen
function getCategoryName(category) {
  const categories = {
    'sozialarbeit': 'Soziale Arbeit',
    'psychologie': 'Psychologie',
    'recht': 'Recht',
    'methoden': 'Methoden'
  };
  return categories[category] || category;
}

// Bibliothek filtern
function filterLib(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  searchLibrary();
}

// Fallstudien laden
async function loadCaseStudies() {
  try {
    const response = await fetch(`${API_URL}/research/cases`);
    const cases = await response.json();

    if (!response.ok) {
      throw new Error(cases.msg || 'Fallstudien konnten nicht geladen werden');
    }

    renderCaseStudies(cases);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Fallstudien rendern
function renderCaseStudies(cases) {
  caseResults.innerHTML = cases.map(caseItem => `
    <div class="case-card">
      <div class="case-header">
        <h3>${caseItem.title}</h3>
        <span class="case-emoji">${caseItem.emoji}</span>
      </div>
      <p><strong>Kategorie:</strong> ${caseItem.category}</p>
      <p><strong>Alter:</strong> ${caseItem.alter}</p>
      <p><strong>Situation:</strong> ${caseItem.situation}</p>
      <p><strong>Problem:</strong> ${caseItem.problem}</p>
      <p><strong>Intervention:</strong> ${caseItem.intervention}</p>
      <p><strong>Ergebnis:</strong> ${caseItem.ergebnis}</p>
      <p><small>Dauer: ${caseItem.dauer}</small></p>
    </div>
  `).join('');
}

// Lernkarten laden
async function loadFlashcards() {
  try {
    const response = await fetch(`${API_URL}/research/flashcards`);
    const cards = await response.json();

    if (!response.ok) {
      throw new Error(cards.msg || 'Lernkarten konnten nicht geladen werden');
    }

    allCards = cards;
    showCard(0, cards);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Karte anzeigen
function showCard(index, cards) {
  if (!cards || cards.length === 0) return;

  currentCardIndex = index;
  cardQuestion.textContent = cards[index].question;
  cardAnswer.textContent = cards[index].answer;
  cardCounter.textContent = `${index + 1}/${cards.length}`;
  flipCard(false);
}

// Nächste Karte
function nextCard() {
  if (allCards.length === 0) return;
  const newIndex = (currentCardIndex + 1) % allCards.length;
  showCard(newIndex, allCards);
}

// Vorherige Karte
function prevCard() {
  if (allCards.length === 0) return;
  const newIndex = (currentCardIndex - 1 + allCards.length) % allCards.length;
  showCard(newIndex, allCards);
}

// Karte umdrehen
function flipCard(flip) {
  cardFlipped = flip !== undefined ? flip : !cardFlipped;
  if (flashcard) {
    flashcard.style.transform = cardFlipped ? 'rotateY(180deg)' : 'rotateY(0)';
  }
}

// Timer starten
function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds === 0) {
      if (timerMinutes === 0) {
        resetTimer();
        alert('Lernsession beendet! 🎉');
        return;
      }
      timerMinutes--;
      timerSeconds = 59;
    } else {
      timerSeconds--;
    }
    updateTimerDisplay();
  }, 1000);
}

// Timer stoppen
function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

// Timer zurücksetzen
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerMinutes = 25;
  timerSeconds = 0;
  updateTimerDisplay();
}

// Timer-Anzeige aktualisieren
function updateTimerDisplay() {
  if (timerDisplay) {
    timerDisplay.textContent = `${timerMinutes.toString().padStart(2, '0')}:${timerSeconds.toString().padStart(2, '0')}`;
  }
}

// Zitat generieren
function generateCitation() {
  const type = document.getElementById('cite-type').value;
  const author = document.getElementById('cite-author').value.trim();
  const year = document.getElementById('cite-year').value.trim();
  const title = document.getElementById('cite-title').value.trim();
  const publisher = document.getElementById('cite-publisher').value.trim();

  if (!author || !year || !title) {
    alert('Bitte Autor, Jahr und Titel ausfüllen!');
    return;
  }

  const apa = `${author} (${year}). ${title}. ${publisher}.`;

  const result = document.getElementById('citation-result');
  result.innerHTML = `<strong>APA Zitat:</strong><br>${apa}`;
  result.classList.add('show');
}

// Fall analysieren
function analyzeFall() {
  const name = document.getElementById('fall-name').value.trim();
  const bereich = document.getElementById('fall-bereich').value;
  const situation = document.getElementById('fall-situation').value.trim();
  const ziele = document.getElementById('fall-ziele').value.trim();

  if (!name || !situation || !ziele) {
    alert('Bitte alle Felder ausfüllen!');
    return;
  }

  const result = document.getElementById('fall-result');
  result.innerHTML = `
    <strong>Fallanalyse: ${name}</strong><br>
    <strong>Bereich:</strong> ${bereich}<br>
    <strong>Ausgangssituation:</strong> ${situation}<br>
    <strong>Interventionsziele:</strong> ${ziele}<br>
    <strong>Empfohlene Intervention:</strong> ${getIntervention(bereich)}
  `;
  result.classList.add('show');
}

// Intervention basierend auf Bereich vorschlagen
function getIntervention(bereich) {
  const interventions = {
    'Kinder & Jugendhilfe': 'Einzelberatung, Familienberatung, Kooperation mit Schule, Jugendamt einbeziehen',
    'Sozialhilfe': 'Sozialberatung, Hilfe zur Selbsthilfe, Behördenbegleitung',
    'Suchtberatung': 'Motivierende Gesprächsführung, Entzugsbegleitung, Gruppentherapie',
    'Flüchtlingshilfe': 'Dolmetscher, Sprachkurse, Traumaberatung, Behördenhilfe',
    'Altenbetreuung': 'Pflegeberatung, Demenzbetreuung, Sozialraumorientierung',
    'Schuldnerberatung': 'Schuldenanalyse, Haushaltsplanung, Verhandlung mit Gläubigern'
  };
  return interventions[bereich] || 'Individuelle Beratung und Unterstützung';
}

// ===== QUIZ-MODUS =====
let quizCards = [];
let quizIndex = 0;
let quizScore = 0;
const QUIZ_COUNT = 10;

function startQuiz() {
  if (allCards.length < 4) {
    alert('Mindestens 4 Lernkarten für den Quiz-Modus erforderlich.');
    return;
  }
  quizCards = shuffle([...allCards]).slice(0, Math.min(QUIZ_COUNT, allCards.length));
  quizIndex = 0;
  quizScore = 0;
  document.getElementById('quiz-start-view').style.display  = 'none';
  document.getElementById('quiz-result-view').style.display = 'none';
  document.getElementById('quiz-play-view').style.display   = 'block';
  showQuizQuestion();
}

function showQuizQuestion() {
  if (quizIndex >= quizCards.length) {
    endQuiz(); return;
  }
  const card = quizCards[quizIndex];
  const others = allCards.filter(c => c._id !== card._id);
  const wrong = shuffle(others).slice(0, 3).map(c => c.answer);
  const options = shuffle([card.answer, ...wrong]);

  document.getElementById('quiz-progress').textContent = `Frage ${quizIndex + 1}/${quizCards.length}`;
  document.getElementById('quiz-question').textContent = card.question;

  document.getElementById('quiz-options').innerHTML = options.map(opt => `
    <button class="quiz-option" onclick="answerQuiz(this, '${CSS.escape(opt)}', '${CSS.escape(card.answer)}')">
      ${opt}
    </button>
  `).join('');
}

function answerQuiz(btn, chosen, correct) {
  const decoded = s => s.replace(/\\./g, c => c[1]);
  const isCorrect = chosen === correct;
  if (isCorrect) { quizScore++; btn.classList.add('correct'); }
  else { btn.classList.add('wrong'); }

  // Richtige Antwort grün markieren
  document.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if (b.textContent.trim() === quizCards[quizIndex].answer) b.classList.add('correct');
  });

  setTimeout(() => { quizIndex++; showQuizQuestion(); }, 1200);
}

function endQuiz() {
  document.getElementById('quiz-play-view').style.display   = 'none';
  document.getElementById('quiz-result-view').style.display = 'block';
  const pct = Math.round((quizScore / quizCards.length) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚';
  document.getElementById('quiz-score').innerHTML =
    `<div class="quiz-score-circle">${pct}%</div>
     <p>${emoji} ${quizScore} von ${quizCards.length} richtig</p>
     <p style="color:#888;font-size:0.85rem">${pct >= 80 ? 'Ausgezeichnet!' : pct >= 60 ? 'Gut gemacht – weiterüben!' : 'Noch etwas üben – du schaffst das!'}</p>`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== GESPRÄCHSPROTOKOLL =====
function erstelleProtokoll() {
  const datum    = document.getElementById('proto-datum').value;
  const zeit     = document.getElementById('proto-zeit').value;
  const art      = document.getElementById('proto-art').value;
  const pseudo   = document.getElementById('proto-pseudonym').value.trim();
  const ort      = document.getElementById('proto-ort').value.trim();
  const inhalt   = document.getElementById('proto-inhalt').value.trim();
  const schritte = document.getElementById('proto-schritte').value.trim();

  if (!pseudo || !inhalt) {
    alert('Bitte mindestens Klient und Gesprächsinhalt ausfüllen.');
    return;
  }

  const d = datum ? new Date(datum).toLocaleDateString('de-DE') : '—';
  const result = document.getElementById('proto-result');

  result.innerHTML = `
    <div class="proto-header">GESPRÄCHSPROTOKOLL</div>
    <table class="proto-table">
      <tr><td>Datum</td><td>${d}${zeit ? ', ' + zeit + ' Uhr' : ''}</td></tr>
      <tr><td>Art</td><td>${art}</td></tr>
      <tr><td>Klient</td><td>${pseudo}</td></tr>
      ${ort ? `<tr><td>Ort</td><td>${ort}</td></tr>` : ''}
    </table>
    <div class="proto-section"><strong>Gesprächsinhalt</strong><p>${inhalt.replace(/\n/g,'<br>')}</p></div>
    ${schritte ? `<div class="proto-section"><strong>Nächste Schritte</strong><p>${schritte.replace(/\n/g,'<br>')}</p></div>` : ''}
    <div class="proto-footer">Erstellt: ${new Date().toLocaleDateString('de-DE')}</div>
  `;
  result.classList.add('show');
  document.getElementById('proto-print-btn').style.display = 'inline-block';
}

function protokollDrucken() {
  const content = document.getElementById('proto-result').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Protokoll</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:700px;margin:auto}
    .proto-header{font-size:1.2rem;font-weight:bold;text-align:center;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}
    .proto-table{width:100%;border-collapse:collapse;margin-bottom:16px}
    .proto-table td{padding:6px 10px;border:1px solid #ccc;font-size:0.9rem}
    .proto-table td:first-child{font-weight:bold;width:120px;background:#f5f5f5}
    .proto-section{margin-bottom:14px}
    .proto-section strong{display:block;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:3px}
    .proto-section p{font-size:0.9rem;line-height:1.6;margin:0}
    .proto-footer{font-size:0.8rem;color:#888;margin-top:20px;text-align:right}
    @media print{body{padding:10px}}
  </style></head><body>${content}</body></html>`);
  w.document.close();
  w.print();
}

// ===== HILFEPLAN =====
function erstelleHilfeplan() {
  const name       = document.getElementById('hp-name').value.trim();
  const geb        = document.getElementById('hp-geb').value.trim();
  const datum      = document.getElementById('hp-datum').value;
  const bezug      = document.getElementById('hp-bezug').value.trim();
  const fachkraft  = document.getElementById('hp-fachkraft').value.trim();
  const problem    = document.getElementById('hp-problem').value.trim();
  const ressourcen = document.getElementById('hp-ressourcen').value.trim();
  const ziele      = document.getElementById('hp-ziele').value.trim();
  const massnahmen = document.getElementById('hp-massnahmen').value.trim();
  const hilfeform  = document.getElementById('hp-hilfeform').value.trim();
  const pruefung   = document.getElementById('hp-pruefung').value;

  if (!name || !problem || !ziele) {
    alert('Bitte mindestens Klient, Problemlage und Ziele ausfüllen.');
    return;
  }

  const fmt = v => v ? new Date(v).toLocaleDateString('de-DE') : '—';
  const result = document.getElementById('hp-result');

  result.innerHTML = `
    <div class="proto-header">HILFEPLAN § 36 SGB VIII</div>
    <table class="proto-table">
      <tr><td>Klient</td><td>${name}</td></tr>
      ${geb ? `<tr><td>Geburtsdatum</td><td>${geb}</td></tr>` : ''}
      ${bezug ? `<tr><td>Bezugsperson</td><td>${bezug}</td></tr>` : ''}
      ${fachkraft ? `<tr><td>Fachkraft</td><td>${fachkraft}</td></tr>` : ''}
      <tr><td>Datum</td><td>${fmt(datum)}</td></tr>
      ${hilfeform ? `<tr><td>Hilfeform</td><td>${hilfeform}</td></tr>` : ''}
    </table>
    <div class="proto-section"><strong>Problemlage und Ausgangssituation</strong><p>${problem.replace(/\n/g,'<br>')}</p></div>
    ${ressourcen ? `<div class="proto-section"><strong>Stärken und Ressourcen</strong><p>${ressourcen.replace(/\n/g,'<br>')}</p></div>` : ''}
    <div class="proto-section"><strong>Vereinbarte Ziele</strong><p>${ziele.replace(/\n/g,'<br>')}</p></div>
    ${massnahmen ? `<div class="proto-section"><strong>Maßnahmen und Hilfsangebote</strong><p>${massnahmen.replace(/\n/g,'<br>')}</p></div>` : ''}
    <div class="proto-footer">Überprüfungstermin: ${fmt(pruefung)} &nbsp;|&nbsp; Erstellt: ${new Date().toLocaleDateString('de-DE')}</div>
  `;
  result.classList.add('show');
  document.getElementById('hp-print-btn').style.display = 'inline-block';
}

function hilfeplanDrucken() {
  const content = document.getElementById('hp-result').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Hilfeplan</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:700px;margin:auto}
    .proto-header{font-size:1.2rem;font-weight:bold;text-align:center;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}
    .proto-table{width:100%;border-collapse:collapse;margin-bottom:16px}
    .proto-table td{padding:6px 10px;border:1px solid #ccc;font-size:0.9rem}
    .proto-table td:first-child{font-weight:bold;width:140px;background:#f5f5f5}
    .proto-section{margin-bottom:14px}
    .proto-section strong{display:block;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:3px}
    .proto-section p{font-size:0.9rem;line-height:1.6;margin:0}
    .proto-footer{font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #ccc;padding-top:8px}
    @media print{body{padding:10px}}
  </style></head><body>${content}</body></html>`);
  w.document.close();
  w.print();
}

// Eigene Lernkarte erstellen (ohne Login)
async function createFlashcard() {
  const question = document.getElementById('new-card-question').value.trim();
  const answer = document.getElementById('new-card-answer').value.trim();
  const msg = document.getElementById('card-save-msg');

  if (!question || !answer) {
    msg.textContent = 'Bitte Frage und Antwort ausfüllen.';
    msg.className = 'save-msg error';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/research/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg);

    document.getElementById('new-card-question').value = '';
    document.getElementById('new-card-answer').value = '';
    msg.textContent = '✓ Karte gespeichert!';
    msg.className = 'save-msg success';
    setTimeout(() => { msg.textContent = ''; }, 3000);

    await loadFlashcards();
  } catch (err) {
    msg.textContent = 'Fehler: ' + err.message;
    msg.className = 'save-msg error';
  }
}

// Fachtext vereinfachen
async function vereinfacheText() {
  const text = document.getElementById('vereinfach-text').value.trim();
  if (!text) { alert('Bitte Text einfügen.'); return; }

  const btn = document.getElementById('vereinfach-btn');
  const result = document.getElementById('vereinfach-result');
  btn.disabled = true;
  btn.textContent = '⏳ Wird vereinfacht…';
  result.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/gemini/formulierung`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aufgabe: 'Erkläre diesen Fachtext oder Gesetzestext in einfacher, verständlicher Sprache für Studierende der Sozialen Arbeit im 1.–4. Semester. Nutze Alltagssprache, erkläre Fachbegriffe, gib ein konkretes Beispiel aus der Praxis.',
        kontext: text
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg);
    result.innerHTML = `<strong>Vereinfachte Erklärung:</strong><br><br>${data.text.replace(/\n/g, '<br>')}`;
    result.classList.add('show');
  } catch (err) {
    result.innerHTML = `<span style="color:red">Fehler: ${err.message}</span>`;
    result.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '📖 Vereinfachen';
  }
}

// Hausarbeits-Assistent
async function hausarbeitsAssistent() {
  const thema = document.getElementById('hausarbeit-thema').value.trim();
  const aufgabe = document.getElementById('hausarbeit-aufgabe').value;
  if (!thema) { alert('Bitte Thema eingeben.'); return; }

  const btn = document.getElementById('hausarbeit-btn');
  const result = document.getElementById('hausarbeit-result');
  btn.disabled = true;
  btn.textContent = '⏳ Wird erstellt…';
  result.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/gemini/formulierung`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aufgabe: `${aufgabe} für eine wissenschaftliche Hausarbeit im Studiengang Soziale Arbeit (Bachelor-Niveau, Deutschland). Nutze Fachsprache der Sozialen Arbeit, beziehe dich auf relevante Theorien, Gesetze und aktuelle Diskurse.`,
        kontext: `Thema der Hausarbeit: ${thema}`
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg);
    result.innerHTML = `<strong>${aufgabe.split(' ').slice(0,3).join(' ')}…</strong><br><br>${data.text.replace(/\n/g, '<br>')}`;
    result.classList.add('show');
  } catch (err) {
    result.innerHTML = `<span style="color:red">Fehler: ${err.message}</span>`;
    result.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '✍️ Generieren';
  }
}

// Falldiagnose mit Gemini KI
async function falldiagnoseKI() {
  const situation = document.getElementById('diagnose-situation').value.trim();
  const bereich = document.getElementById('diagnose-bereich').value;

  if (!situation) {
    alert('Bitte die Fallsituation beschreiben.');
    return;
  }

  const btn = document.getElementById('diagnose-btn');
  const result = document.getElementById('diagnose-result');

  btn.disabled = true;
  btn.textContent = '⏳ Wird analysiert…';
  result.innerHTML = '';
  result.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/gemini/formulierung`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aufgabe: `Analysiere diesen Sozialarbeitsfall aus dem Bereich "${bereich}" und gib strukturierte Empfehlungen: 1) Hauptprobleme benennen, 2) passende Methoden und Interventionen vorschlagen, 3) mögliche Hilfsangebote nennen, 4) nächste konkrete Schritte empfehlen.`,
        kontext: situation
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.msg || 'Anfrage fehlgeschlagen');

    result.innerHTML = `<strong>KI-Fallanalyse:</strong><br><br>${data.text.replace(/\n/g, '<br>')}`;
    result.classList.add('show');
  } catch (err) {
    console.error(err);
    result.innerHTML = `<span style="color:red">Fehler: ${err.message}</span>`;
    result.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍 Analyse starten';
  }
}

// Formulierungshilfe mit Gemini KI
async function geminiFormulierung() {
  const kontext = document.getElementById('gemini-kontext').value.trim();
  const aufgabe = document.getElementById('gemini-aufgabe').value;

  if (!kontext) {
    alert('Bitte den Kontext/die Situation beschreiben.');
    return;
  }

  const btn = document.getElementById('gemini-btn');
  const result = document.getElementById('gemini-result');

  btn.disabled = true;
  btn.textContent = '⏳ Wird generiert…';
  result.innerHTML = '';
  result.classList.remove('show');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/gemini/formulierung`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {})
      },
      body: JSON.stringify({ kontext, aufgabe })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'KI-Anfrage fehlgeschlagen');
    }

    result.innerHTML = `<strong>Formulierungsvorschlag:</strong><br><br>${data.text.replace(/\n/g, '<br>')}`;
    result.classList.add('show');
  } catch (err) {
    console.error(err);
    result.innerHTML = `<span style="color:red">Fehler: ${err.message}</span>`;
    result.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Formulierung generieren';
  }
}

// Noten berechnen
function calculateGrade() {
  const exams = parseInt(document.getElementById('exam-count').value);
  const weight = parseInt(document.getElementById('exam-weight').value);
  const grade = parseFloat(document.getElementById('exam-grade').value);

  if (isNaN(exams) || isNaN(weight) || isNaN(grade)) {
    alert('Bitte gültige Werte eingeben!');
    return;
  }

  const average = grade;

  const result = document.getElementById('grade-result');
  result.innerHTML = `
    <strong>Berechnung:</strong><br>
    ${exams} Prüfungen × ${weight}% Gewichtung<br>
    Durchschnittsnote: ${average.toFixed(2)}
  `;
  result.classList.add('show');
}

// Netzwerk-Gruppen laden
async function loadGroups() {
  try {
    const response = await fetch(`${API_URL}/research/groups`);
    const groups = await response.json();

    if (!response.ok) {
      throw new Error(groups.msg || 'Gruppen konnten nicht geladen werden');
    }

    renderGroups(groups);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Gruppen rendern
function renderGroups(groups) {
  groupsContainer.innerHTML = groups.map(group => `
    <div class="group-card">
      <div class="group-icon">${group.icon}</div>
      <div class="group-info">
        <h3>${group.name}</h3>
        <p>${group.members} Mitglieder • ${group.topic}</p>
      </div>
      <button class="join-btn">Beitreten</button>
    </div>
  `).join('');
}

// Mentoren laden
async function loadMentors() {
  try {
    const response = await fetch(`${API_URL}/research/mentors`);
    const mentors = await response.json();

    if (!response.ok) {
      throw new Error(mentors.msg || 'Mentoren konnten nicht geladen werden');
    }

    renderMentors(mentors);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Mentoren rendern
function renderMentors(mentors) {
  mentorsContainer.innerHTML = mentors.map(mentor => `
    <div class="mentor-card">
      <div class="mentor-emoji">${mentor.emoji}</div>
      <div class="mentor-info">
        <h3>${mentor.name}</h3>
        <p>${mentor.fach}</p>
        <p>${mentor.verfuegbar ? '✅ Verfügbar' : '❌ Nicht verfügbar'}</p>
      </div>
      ${mentor.verfuegbar
        ? `<button class="contact-btn" onclick="contactMentor('${mentor.name}')">Kontakt</button>`
        : `<button class="contact-btn" disabled>Nicht verfügbar</button>`}
    </div>
  `).join('');
}

// Mentor kontaktieren
function contactMentor(name) {
  alert(`Kontaktanfrage an ${name} gesendet! ✉️`);
}

// Ressourcen laden
async function loadResources() {
  try {
    const response = await fetch(`${API_URL}/research/resources`);
    const resources = await response.json();

    if (!response.ok) {
      throw new Error(resources.msg || 'Ressourcen konnten nicht geladen werden');
    }

    renderResources(resources);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Ressourcen rendern (gruppiert nach Kategorie)
function renderResources(resources) {
  const categoryLabels = {
    organisation: '🏢 Organisationen & Verbände',
    literatur:    '📚 Kostenlose Fachliteratur & Repositorien',
    recht:        '⚖️ Gesetze & Recht',
    statistik:    '📊 Statistik & Forschungsdaten'
  };

  const order = ['literatur', 'recht', 'statistik', 'organisation'];

  const grouped = {};
  resources.forEach(r => {
    const cat = r.category || 'organisation';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  });

  resourcesGrid.innerHTML = order
    .filter(cat => grouped[cat] && grouped[cat].length > 0)
    .map(cat => `
      <div class="resource-category">
        <h3 class="resource-category-title">${categoryLabels[cat] || cat}</h3>
        <div class="resource-category-grid">
          ${grouped[cat].map(resource => `
            <div class="resource-card">
              <div class="res-icon">${resource.icon}</div>
              <h4>${resource.name}</h4>
              <p>${resource.desc}</p>
              <a href="${resource.link}" target="_blank" rel="noopener noreferrer">→ Öffnen</a>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
}

// Tab anzeigen
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabBtn = document.querySelector(`.tab[onclick="showTab('${tab}')"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const tabContent = document.getElementById(`${tab}-tab`);
  if (tabContent) tabContent.classList.add('active');

  switch (tab) {
    case 'lernen':     loadFlashcards();                          break;
    case 'wissen':     searchLibrary(); loadCaseStudies();        break;
    case 'praxis':                                                 break;
    case 'akademisch':                                             break;
    case 'ki':                                                     break;
    case 'netzwerk':   loadGroups(); loadMentors(); loadResources(); break;
  }
}

// Initialisierung
window.onload = function() {
  updateTimerDisplay();
  // Hash-basierte Tab-Auswahl (von index.html-Links)
  const hash = window.location.hash.replace('#', '');
  const validTabs = ['lernen', 'wissen', 'praxis', 'akademisch', 'ki', 'netzwerk'];
  showTab(validTabs.includes(hash) ? hash : 'lernen');
};
