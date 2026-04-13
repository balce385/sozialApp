// ── Konfiguration ──────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000/api';
const token   = localStorage.getItem('token');

if (!token) { window.location.href = 'index.html'; }

// ── Hilfsfunktionen ────────────────────────────────────────────────────────
async function api(pfad, optionen = {}) {
  const headers = { 'Content-Type': 'application/json', ...optionen.headers };
  if (token) headers['x-auth-token'] = token;
  const res   = await fetch(`${API_URL}${pfad}`, { ...optionen, headers });
  const daten = await res.json();
  if (!res.ok) throw new Error(daten.msg || `Fehler ${res.status}`);
  return daten;
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Einfaches Markdown → HTML (für KI-Ausgaben)
function renderMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/\n/g,           '<br>');
}

// Ladebutton-Zustand
function setLaden(btnId, laden, origText = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (laden) {
    btn.dataset.origText = origText || btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Wird verarbeitet…';
  } else {
    btn.disabled = false;
    btn.innerHTML = origText || btn.dataset.origText || btn.innerHTML;
  }
}

// ── TAB-NAVIGATION ─────────────────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick="showTab('${name}')"]`).classList.add('active');
  document.getElementById(`${name}-tab`).classList.add('active');

  const tabAktionen = {
    bibliothek: () => searchLibrary(),
    datenbanken: () => ladeDatenbankListe(),
    fallstudien: () => loadCaseStudies(),
    tools:       () => loadFlashcards(),
    netzwerk:    () => { loadGroups(); loadMentors(); },
    ressourcen:  () => loadResources(),
    ki:          () => {}
  };
  tabAktionen[name]?.();
}

// ── BIBLIOTHEK ─────────────────────────────────────────────────────────────
async function searchLibrary() {
  const suche    = document.getElementById('lib-search').value;
  const aktiv    = document.querySelector('.filter-btn.active');
  const category = aktiv ? aktiv.dataset.category : 'all';

  const params = new URLSearchParams();
  if (suche) params.set('search', suche);
  if (category && category !== 'all') params.set('category', category);

  try {
    const items = await api(`/research/library?${params}`);
    const container = document.getElementById('library-results');
    container.innerHTML = items.length === 0
      ? '<p class="leer">Keine Bücher gefunden.</p>'
      : items.map(item => `
          <div class="library-card">
            <span class="badge">${getCategoryName(item.category)}</span>
            <h3>${escapeHTML(item.title)}</h3>
            <p><strong>Autor:</strong> ${escapeHTML(item.author)} (${item.year})</p>
            <p><strong>Verlag:</strong> ${escapeHTML(item.publisher)}</p>
            <p>${escapeHTML(item.description)}</p>
            <p><small>${item.pages} Seiten</small></p>
          </div>`).join('');
  } catch (err) {
    document.getElementById('library-results').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function filterLib(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  searchLibrary();
}

function getCategoryName(cat) {
  return { sozialarbeit: 'Soziale Arbeit', psychologie: 'Psychologie', recht: 'Recht', methoden: 'Methoden' }[cat] || cat;
}

// ── ONLINE-DATENBANKEN ──────────────────────────────────────────────────────
let aktivDB   = 'openalex';
let dbSeite   = 1;
let letzterSuchbegriff = '';

const DB_INFO = {
  openalex:        { name: 'OpenAlex',         farbe: '#1565c0', info: '<strong>OpenAlex</strong> — 200+ Mio. Werke, komplett kostenlos, kein Account nötig.<br><span class="tipp">💡 Suche auf DE oder EN: "Soziale Arbeit", "SGB VIII", "social work"</span>' },
  semanticscholar: { name: 'Semantic Scholar', farbe: '#1565c0', info: '<strong>Semantic Scholar</strong> — KI-gestützte Suche, 200 Mio+ Paper, Zitationsanalyse.<br><span class="tipp">💡 Ideal für englischsprachige Forschung und Zitationsgraphen.</span>' },
  crossref:        { name: 'CrossRef',         farbe: '#1565c0', info: '<strong>CrossRef</strong> — DOI-Auflösung & Metadaten für 140+ Mio. Werke.<br><span class="tipp">💡 Gut zum Verifizieren von Zitationsangaben und DOIs.</span>' }
};

function switchDB(db, btn) {
  aktivDB = db;
  document.querySelectorAll('.db-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const suchArea  = document.getElementById('db-search-area');
  const infoBox   = document.getElementById('db-filter-info');
  const uebersicht = document.getElementById('uebersicht-area');
  const results   = document.getElementById('db-results');
  const pag       = document.getElementById('db-pagination');

  if (db === 'uebersicht') {
    suchArea.style.display  = 'none';
    infoBox.style.display   = 'none';
    uebersicht.style.display = 'block';
    results.innerHTML = '';
    pag.innerHTML = '';
    ladeDatenbankListe();
    return;
  }

  suchArea.style.display  = 'flex';
  infoBox.style.display   = 'block';
  uebersicht.style.display = 'none';
  infoBox.innerHTML = DB_INFO[db]?.info || '';
  results.innerHTML = '';
  pag.innerHTML = '';
  dbSeite = 1;
}

async function searchDB(seite = 1) {
  const q = document.getElementById('db-search').value.trim();
  if (!q) { alert('Bitte einen Suchbegriff eingeben.'); return; }

  letzterSuchbegriff = q;
  dbSeite = seite;

  const results = document.getElementById('db-results');
  const pag     = document.getElementById('db-pagination');
  results.innerHTML = '<p class="loading">🔍 Suche läuft…</p>';
  pag.innerHTML = '';

  try {
    const daten = await api(`/databases/${aktivDB}?q=${encodeURIComponent(q)}&seite=${seite}`);
    renderDBResults(daten, seite);
  } catch (err) {
    results.innerHTML = `<p class="error">Fehler: ${err.message}</p>`;
  }
}

function renderDBResults(daten, seite) {
  const results = document.getElementById('db-results');
  const pag     = document.getElementById('db-pagination');
  const liste   = daten.ergebnisse || [];

  if (liste.length === 0) {
    results.innerHTML = '<p class="leer">Keine Ergebnisse gefunden. Versuche andere Suchbegriffe.</p>';
    return;
  }

  results.innerHTML = `<p style="color:var(--text-soft);font-size:.85rem;margin-bottom:12px">${daten.gesamt?.toLocaleString('de') || '?'} Ergebnisse gefunden</p>`
    + liste.map(item => {
      const doi    = item.doi || '';
      const doiUrl = doi.startsWith('http') ? doi : doi ? `https://doi.org/${doi}` : '';
      const pdfUrl = item.oa_url || item.pdf_url || '';
      const titel  = escapeHTML(item.titel || item.title || '—');
      const autoren = escapeHTML(item.autoren || '');
      const jahr   = item.jahr ? `(${item.jahr})` : '';
      const quelle = escapeHTML(item.quelle || item.journal || '');
      const zitiert = item.zitiert != null ? item.zitiert : null;
      const abstract = item.abstract ? escapeHTML(item.abstract.slice(0, 300)) + '…' : '';

      return `<div class="db-result-card">
        <h4>${titel}</h4>
        <p class="meta">${autoren} ${jahr} ${quelle ? `• ${quelle}` : ''}</p>
        ${abstract ? `<p class="abstract">${abstract}</p>` : ''}
        <div class="links">
          ${doiUrl ? `<a href="${escapeHTML(doiUrl)}" target="_blank" rel="noopener">DOI</a>` : ''}
          ${pdfUrl ? `<a href="${escapeHTML(pdfUrl)}" target="_blank" rel="noopener" class="oa-badge">📄 Open Access</a>` : ''}
          ${zitiert != null ? `<span class="zitiert-badge">📊 ${zitiert} Zitate</span>` : ''}
        </div>
      </div>`;
    }).join('');

  // Seitennummerierung
  const gesamtSeiten = Math.min(Math.ceil((daten.gesamt || 0) / 15), 10);
  if (gesamtSeiten > 1) {
    pag.innerHTML = '';
    if (seite > 1) {
      const prev = document.createElement('button');
      prev.className = 'pag-btn';
      prev.textContent = '← Zurück';
      prev.onclick = () => searchDB(seite - 1);
      pag.appendChild(prev);
    }
    const info = document.createElement('span');
    info.style.cssText = 'padding:8px 16px;color:var(--text-soft);font-size:.85rem';
    info.textContent = `Seite ${seite} von ${gesamtSeiten}`;
    pag.appendChild(info);
    if (seite < gesamtSeiten) {
      const next = document.createElement('button');
      next.className = 'pag-btn';
      next.textContent = 'Weiter →';
      next.onclick = () => searchDB(seite + 1);
      pag.appendChild(next);
    }
  }
}

async function ladeDatenbankListe() {
  const container = document.getElementById('db-liste-container');
  if (!container) return;
  container.innerHTML = '<p class="loading">Lade Datenbanken…</p>';
  try {
    const liste = await api('/databases/liste');
    container.innerHTML = liste.map(db => `
      <div class="db-liste-card">
        <h4><a href="${escapeHTML(db.url)}" target="_blank" rel="noopener">${escapeHTML(db.name)} ↗</a></h4>
        <p class="desc">${escapeHTML(db.beschreibung)}</p>
        <div class="tags">
          <span class="tag">${escapeHTML(db.fokus)}</span>
          <span class="tag">${escapeHTML(db.sprache)}</span>
          ${db.kostenlos ? '<span class="tag gruen">✓ Kostenlos</span>' : '<span class="tag">Hochschullizenz</span>'}
          ${db.api ? '<span class="tag gruen">API-Suche</span>' : ''}
        </div>
        ${db.tipp ? `<p class="tipp-box">💡 ${escapeHTML(db.tipp)}</p>` : ''}
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// ── FALLSTUDIEN ────────────────────────────────────────────────────────────
async function loadCaseStudies(category = '') {
  const params = category ? `?category=${category}` : '';
  try {
    const cases = await api(`/research/cases${params}`);
    const container = document.getElementById('case-results');
    container.innerHTML = cases.length === 0
      ? '<p class="leer">Keine Fallstudien gefunden.</p>'
      : cases.map(c => `
          <div class="case-card">
            <div class="case-header">
              <h3>${escapeHTML(c.title)}</h3>
              <span class="case-emoji">${c.emoji || '📋'}</span>
            </div>
            <p><strong>Kategorie:</strong> ${escapeHTML(c.category)}</p>
            <p><strong>Alter:</strong> ${escapeHTML(c.alter)}</p>
            <p><strong>Situation:</strong> ${escapeHTML(c.situation)}</p>
            <p><strong>Problem:</strong> ${escapeHTML(c.problem)}</p>
            <p><strong>Intervention:</strong> ${escapeHTML(c.intervention)}</p>
            <p><strong>Ergebnis:</strong> ${escapeHTML(c.ergebnis)}</p>
            <p><small>⏱ Dauer: ${escapeHTML(c.dauer)}</small></p>
          </div>`).join('');
  } catch (err) {
    document.getElementById('case-results').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function filterCases(btn) {
  document.querySelectorAll('#fallstudien-tab .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadCaseStudies(btn.dataset.category);
}

// ── KARTEIKARTEN ───────────────────────────────────────────────────────────
let alleKarten     = [];
let aktuelleKarte  = 0;
let karteUmgedreht = false;

async function loadFlashcards() {
  try {
    alleKarten = await api('/research/flashcards');
    zeigeKarte(0);
  } catch (err) {
    document.getElementById('card-question').textContent = 'Fehler beim Laden.';
  }
}

function zeigeKarte(index) {
  if (!alleKarten.length) return;
  aktuelleKarte  = index;
  karteUmgedreht = false;
  document.getElementById('flashcard-inner').classList.remove('flipped');
  document.getElementById('card-question').textContent = alleKarten[index].question;
  document.getElementById('card-answer').textContent   = alleKarten[index].answer;
  document.getElementById('card-counter').textContent  = `${index + 1} / ${alleKarten.length}`;
}

function flipCard()  { karteUmgedreht = !karteUmgedreht; document.getElementById('flashcard-inner').classList.toggle('flipped'); }
function nextCard()  { zeigeKarte((aktuelleKarte + 1) % alleKarten.length); }
function prevCard()  { zeigeKarte((aktuelleKarte - 1 + alleKarten.length) % alleKarten.length); }

// ── POMODORO-TIMER ─────────────────────────────────────────────────────────
let timerInterval = null;
let timerSek = 0;
let timerMin = 25;
let timerLaeuft = false;

function setTimerMinutes(min) {
  if (!timerLaeuft) { timerMin = parseInt(min) || 25; timerSek = 0; updateTimerDisplay(); }
}

function startTimer() {
  if (timerLaeuft) return;
  timerLaeuft = true;
  timerInterval = setInterval(() => {
    if (timerSek === 0) {
      if (timerMin === 0) { clearInterval(timerInterval); timerLaeuft = false; alert('⏱️ Lernsession beendet! Kurze Pause machen.'); return; }
      timerMin--;
      timerSek = 59;
    } else {
      timerSek--;
    }
    updateTimerDisplay();
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerLaeuft = false;
  timerMin = parseInt(document.getElementById('timer-min').value) || 25;
  timerSek = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  document.getElementById('timer-display').textContent =
    `${String(timerMin).padStart(2,'0')}:${String(timerSek).padStart(2,'0')}`;
}

// ── ZITIERGENERATOR ────────────────────────────────────────────────────────
function generateCitation() {
  const typ       = document.getElementById('cite-type').value;
  const autor     = document.getElementById('cite-author').value.trim();
  const jahr      = document.getElementById('cite-year').value.trim();
  const titel     = document.getElementById('cite-title').value.trim();
  const verlag    = document.getElementById('cite-publisher').value.trim();
  const ort       = document.getElementById('cite-ort').value.trim();

  if (!autor || !jahr || !titel) { alert('Bitte Autor, Jahr und Titel ausfüllen.'); return; }

  let zitat = '';
  if (typ === 'buch') {
    zitat = `${autor} (${jahr}). <em>${escapeHTML(titel)}</em>. ${ort ? escapeHTML(ort) + ': ' : ''}${escapeHTML(verlag)}.`;
  } else if (typ === 'artikel') {
    zitat = `${autor} (${jahr}). ${escapeHTML(titel)}. <em>${escapeHTML(verlag)}</em>.`;
  } else {
    zitat = `${autor} (${jahr}). ${escapeHTML(titel)}. In ${escapeHTML(verlag)}.`;
  }

  const result = document.getElementById('citation-result');
  result.innerHTML = `<strong>APA-Zitat:</strong><br>${zitat}`;
  result.classList.add('show');
}

// ── NOTENRECHNER ───────────────────────────────────────────────────────────
let notenListe = [];

function addNote() {
  const note    = parseFloat(document.getElementById('note-input').value);
  const gewicht = parseInt(document.getElementById('gewicht-input').value) || 100;
  if (isNaN(note) || note < 1 || note > 5) { alert('Note muss zwischen 1.0 und 5.0 liegen.'); return; }
  notenListe.push({ note, gewicht });
  renderNotenListe();
  document.getElementById('note-input').value    = '';
  document.getElementById('gewicht-input').value = '';
}

function renderNotenListe() {
  document.getElementById('noten-liste').innerHTML = notenListe.map((n, i) =>
    `<div class="noten-eintrag"><span>Note ${n.note.toFixed(1)}</span><span>Gewichtung ${n.gewicht}%</span>
     <button onclick="notenListe.splice(${i},1);renderNotenListe()" style="background:none;border:none;cursor:pointer;color:#c62828">✕</button></div>`
  ).join('') || '<p style="color:var(--text-soft);font-size:.85rem">Noch keine Noten hinzugefügt.</p>';
}

function berechneNoten() {
  if (!notenListe.length) { alert('Bitte zuerst Noten hinzufügen.'); return; }
  const gesGewicht = notenListe.reduce((s, n) => s + n.gewicht, 0);
  const gewNoten   = notenListe.reduce((s, n) => s + n.note * n.gewicht, 0);
  const durchschnitt = gewNoten / gesGewicht;
  const result = document.getElementById('grade-result');
  result.innerHTML = `<strong>Gewichteter Durchschnitt: ${durchschnitt.toFixed(2)}</strong><br>
    ${notenListe.length} Note(n) · Gesamtgewichtung: ${gesGewicht}%`;
  result.classList.add('show');
}

// ── KI-ASSISTENT ───────────────────────────────────────────────────────────
function switchKI(panel) {
  document.querySelectorAll('.ki-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ki-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.ki-tab[onclick="switchKI('${panel}')"]`).classList.add('active');
  document.getElementById(`ki-${panel}`).classList.add('active');
}

// Formulierungshilfe
async function formulierungshilfe() {
  const text  = document.getElementById('formul-text').value.trim();
  const modus = document.getElementById('formul-modus').value;
  if (!text) { alert('Bitte Text eingeben.'); return; }

  setLaden('formul-btn', true);
  document.getElementById('formul-result').style.display = 'none';

  try {
    const daten = await api('/ai/formulierung', {
      method: 'POST',
      body: JSON.stringify({ text, modus })
    });
    document.getElementById('formul-output').innerHTML = renderMarkdown(daten.ergebnis);
    document.getElementById('formul-result').style.display = 'block';
  } catch (err) {
    alert('KI-Fehler: ' + err.message);
  } finally {
    setLaden('formul-btn', false, '🤖 KI überarbeiten lassen');
  }
}

// KI-Fallanalyse
async function kiFallanalyse() {
  const name        = document.getElementById('ki-fall-name').value.trim();
  const bereich     = document.getElementById('ki-fall-bereich').value;
  const situation   = document.getElementById('ki-fall-situation').value.trim();
  const hintergrund = document.getElementById('ki-fall-hintergrund').value.trim();
  const ziele       = document.getElementById('ki-fall-ziele').value.trim();

  if (!name || !situation || !ziele) {
    alert('Bitte Name/Bezeichnung, Situation und Ziele ausfüllen.'); return;
  }

  setLaden('fall-btn', true);
  document.getElementById('fall-result').style.display = 'none';

  try {
    const daten = await api('/ai/fallanalyse', {
      method: 'POST',
      body: JSON.stringify({ name, bereich, situation, hintergrund, ziele })
    });
    const output = document.getElementById('fall-output');
    output.innerHTML = renderMarkdown(daten.analyse);
    document.getElementById('fall-result').style.display = 'block';
  } catch (err) {
    alert('KI-Fehler: ' + err.message);
  } finally {
    setLaden('fall-btn', false, '🤖 Fallanalyse erstellen');
  }
}

// Recherchehilfe
async function kiRecherche() {
  const frage   = document.getElementById('recherche-frage').value.trim();
  const kontext = document.getElementById('recherche-kontext').value.trim();
  if (!frage) { alert('Bitte eine Frage eingeben.'); return; }

  setLaden('recherche-btn', true);
  document.getElementById('recherche-result').style.display = 'none';

  try {
    const daten = await api('/ai/recherche', {
      method: 'POST',
      body: JSON.stringify({ frage, kontext })
    });
    const output = document.getElementById('recherche-output');
    output.innerHTML = renderMarkdown(daten.antwort);
    document.getElementById('recherche-result').style.display = 'block';
  } catch (err) {
    alert('KI-Fehler: ' + err.message);
  } finally {
    setLaden('recherche-btn', false, '🤖 Recherche starten');
  }
}

// Freier Chat
let chatVerlauf = [];

async function chatSenden() {
  const input   = document.getElementById('chat-input');
  const nachricht = input.value.trim();
  if (!nachricht) return;

  input.value = '';
  chatVerlauf.push({ role: 'user', content: nachricht });
  renderChatVerlauf();

  try {
    const daten = await api('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ nachricht, verlauf: chatVerlauf.slice(-18) })
    });
    chatVerlauf.push({ role: 'assistant', content: daten.antwort });
    renderChatVerlauf();
  } catch (err) {
    chatVerlauf.push({ role: 'assistant', content: `⚠️ Fehler: ${err.message}` });
    renderChatVerlauf();
  }
}

function renderChatVerlauf() {
  const verlaufDiv = document.getElementById('chat-verlauf');
  if (chatVerlauf.length === 0) {
    verlaufDiv.innerHTML = '<p style="color:var(--text-soft);font-size:.85rem;text-align:center;padding:20px">Stelle eine Frage zur Sozialen Arbeit…</p>';
    return;
  }
  verlaufDiv.innerHTML = chatVerlauf.map(msg => `
    <div class="chat-msg ${msg.role === 'user' ? 'user' : 'ki'}">
      ${escapeHTML(msg.content)}
    </div>`).join('');
  verlaufDiv.scrollTop = verlaufDiv.scrollHeight;
}

function chatLeeren() {
  chatVerlauf = [];
  renderChatVerlauf();
}

// Kopieren
async function kopiereText(elementId) {
  const el = document.getElementById(elementId);
  const text = el.innerText || el.textContent;
  try {
    await navigator.clipboard.writeText(text);
    alert('Text kopiert! 📋');
  } catch {
    alert('Bitte manuell kopieren (Strg+A, Strg+C).');
  }
}

// Zeichenzähler für Formulierungsfeld
document.getElementById('formul-text')?.addEventListener('input', function () {
  document.getElementById('formul-count').textContent = `${this.value.length} / 3000`;
});

// ── NETZWERK ────────────────────────────────────────────────────────────────
async function loadGroups() {
  try {
    const groups = await api('/research/groups');
    document.getElementById('groups-container').innerHTML = groups.map(g => `
      <div class="group-card">
        <div class="group-icon">${g.icon}</div>
        <div class="group-info">
          <h4>${escapeHTML(g.name)}</h4>
          <p>${g.members} Mitglieder · ${escapeHTML(g.topic)}</p>
        </div>
        <button class="join-btn">Beitreten</button>
      </div>`).join('');
  } catch (err) {
    document.getElementById('groups-container').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function loadMentors() {
  try {
    const mentors = await api('/research/mentors');
    document.getElementById('mentors-container').innerHTML = mentors.map(m => `
      <div class="mentor-card">
        <div class="mentor-emoji">${m.emoji}</div>
        <div class="mentor-info">
          <h4>${escapeHTML(m.name)}</h4>
          <p>${escapeHTML(m.fach)}</p>
          <p class="mentor-status ${m.verfuegbar ? 'gruen' : 'rot'}">${m.verfuegbar ? '● Verfügbar' : '● Nicht verfügbar'}</p>
        </div>
        <button class="contact-btn" ${!m.verfuegbar ? 'disabled' : ''}
          onclick="${m.verfuegbar ? `kontaktMentor('${escapeHTML(m.name)}')` : ''}">
          ${m.verfuegbar ? 'Kontakt' : 'N/A'}
        </button>
      </div>`).join('');
  } catch (err) {
    document.getElementById('mentors-container').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function kontaktMentor(name) { alert(`Kontaktanfrage an ${name} gesendet! ✉️`); }

// ── RESSOURCEN ──────────────────────────────────────────────────────────────
async function loadResources() {
  try {
    const resources = await api('/research/resources');
    document.getElementById('resources-grid').innerHTML = resources.map(r => `
      <div class="resource-card">
        <div class="res-icon">${r.icon}</div>
        <h4>${escapeHTML(r.name)}</h4>
        <p>${escapeHTML(r.desc)}</p>
        <a href="${escapeHTML(r.link)}" target="_blank" rel="noopener">Besuchen ↗</a>
      </div>`).join('');
  } catch (err) {
    document.getElementById('resources-grid').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// ── INITIALISIERUNG ─────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  updateTimerDisplay();
  renderChatVerlauf();

  // URL-Hash für direkte Tab-Navigation (z. B. research.html#ki)
  const hash = window.location.hash.replace('#', '');
  const gueltigeeTabs = ['bibliothek', 'datenbanken', 'fallstudien', 'tools', 'ki', 'netzwerk', 'ressourcen'];
  showTab(gueltigeeTabs.includes(hash) ? hash : 'bibliothek');
});
