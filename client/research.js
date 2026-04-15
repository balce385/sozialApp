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
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
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
  document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
  document.getElementById(`${tab}-tab`).classList.add('active');

  switch (tab) {
    case 'library':   searchLibrary();                    break;
    case 'cases':     loadCaseStudies();                  break;
    case 'tools':     loadFlashcards();                   break;
    case 'network':   loadGroups(); loadMentors();        break;
    case 'resources': loadResources();                    break;
  }
}

// Initialisierung
window.onload = function() {
  updateTimerDisplay();
  showTab('library');
};
