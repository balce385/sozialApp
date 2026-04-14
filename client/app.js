// ── Globaler Zustand ───────────────────────────────────────────────────────
let currentUser = null;
let token       = localStorage.getItem('token');

const API_URL   = 'http://localhost:5000/api';

// ── DOM-Referenzen ─────────────────────────────────────────────────────────
const loginPage    = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const mainPage     = document.getElementById('main-page');

// ── Hilfsfunktion: API-Aufruf ──────────────────────────────────────────────
async function api(pfad, optionen = {}) {
  const headers = { 'Content-Type': 'application/json', ...optionen.headers };
  if (token) headers['x-auth-token'] = token;

  const res = await fetch(`${API_URL}${pfad}`, { ...optionen, headers });
  const daten = await res.json();

  if (!res.ok) throw new Error(daten.msg || `Fehler ${res.status}`);
  return daten;
}

// ── Seitennavigation ───────────────────────────────────────────────────────
function showLogin()    { setActivePage(loginPage); }
function showRegister() { setActivePage(registerPage); }
function showMainPage() {
  if (!token) { showLogin(); return; }
  setActivePage(mainPage);
  aktualisiereProfilSidebar();
  showPage('feed');
  renderPosts();
}

function setActivePage(seite) {
  [loginPage, registerPage, mainPage].forEach(p => p && p.classList.remove('active'));
  if (seite) seite.classList.add('active');
}

function showPage(name) {
  document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
  const ziel = document.getElementById(`${name}-page`);
  if (ziel) ziel.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLink = document.querySelector(`.nav-link[onclick="showPage('${name}')"]`);
  if (navLink) navLink.classList.add('active');

  if (name === 'profile') ladeProfilSeite();
}

// ── Authentifizierung ──────────────────────────────────────────────────────
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Bitte Benutzername und Passwort eingeben.');
    return;
  }

  try {
    const daten = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    token = daten.token;
    localStorage.setItem('token', token);
    await ladeAktuellenBenutzer();
    showMainPage();
  } catch (err) {
    alert('Anmeldung fehlgeschlagen: ' + err.message);
  }
}

async function register() {
  const name     = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name || !username || !email || !password) {
    alert('Bitte alle Felder ausfüllen.');
    return;
  }

  try {
    const daten = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password })
    });
    token = daten.token;
    localStorage.setItem('token', token);
    await ladeAktuellenBenutzer();
    showMainPage();
  } catch (err) {
    alert('Registrierung fehlgeschlagen: ' + err.message);
  }
}

function logout() {
  localStorage.removeItem('token');
  token = null;
  currentUser = null;
  showLogin();
}

async function ladeAktuellenBenutzer() {
  currentUser = await api('/users/me');
  return currentUser;
}

// ── Profil ─────────────────────────────────────────────────────────────────
function aktualisiereProfilSidebar() {
  if (!currentUser) return;
  document.getElementById('profile-name').textContent      = currentUser.name;
  document.getElementById('profile-username').textContent  = '@' + currentUser.username;
  document.getElementById('profile-avatar').textContent    = currentUser.emoji || '🎓';
  document.getElementById('compose-avatar').textContent    = currentUser.emoji || '🎓';
  document.getElementById('followers-count').textContent   = currentUser.followers.length;
  document.getElementById('following-count').textContent   = currentUser.following.length;
}

function ladeProfilSeite() {
  if (!currentUser) return;
  document.getElementById('profile-name-large').textContent     = currentUser.name;
  document.getElementById('profile-username-large').textContent = '@' + currentUser.username;
  document.getElementById('profile-avatar-large').textContent   = currentUser.emoji || '🎓';
  document.getElementById('profile-bio-display').textContent    = currentUser.bio || '';
  document.getElementById('profile-name-input').value = currentUser.name;
  document.getElementById('profile-bio').value         = currentUser.bio || '';
  document.getElementById('profile-emoji').value       = currentUser.emoji || '';
  renderUserPosts();
}

async function updateProfile() {
  const name  = document.getElementById('profile-name-input').value.trim();
  const bio   = document.getElementById('profile-bio').value.trim();
  const emoji = document.getElementById('profile-emoji').value.trim();

  if (!name) { alert('Name ist erforderlich.'); return; }

  try {
    currentUser = await api('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ name, bio, emoji })
    });
    aktualisiereProfilSidebar();
    ladeProfilSeite();
    alert('Profil erfolgreich aktualisiert! ✅');
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
}

// ── Posts / Feed ───────────────────────────────────────────────────────────
function zeitstempel(datum) {
  const diff = Date.now() - new Date(datum).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'Gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const std = Math.floor(min / 60);
  if (std < 24) return `vor ${std} Std.`;
  return `vor ${Math.floor(std / 24)} Tagen`;
}

function postHTML(post, eigenerPost = false) {
  const schonGeliket = currentUser && post.likes.some(id =>
    id === currentUser._id || id?._id === currentUser._id
  );

  const kommentare = (post.comments || []).map(k => `
    <div class="comment">
      <span>${k.user?.emoji || '🎓'}</span>
      <div><span class="comment-author">${escapeHTML(k.user?.name || '')}</span>
      &nbsp;${escapeHTML(k.text)}</div>
    </div>
  `).join('');

  return `
    <div class="post" data-id="${post._id}">
      <div class="post-header">
        <div class="post-avatar">${post.user?.emoji || '🎓'}</div>
        <div class="post-info">
          <h4>${escapeHTML(post.user?.name || '')}</h4>
          <p>@${escapeHTML(post.user?.username || '')}</p>
        </div>
        <span class="post-time">${zeitstempel(post.createdAt)}</span>
      </div>
      <p class="post-text">${escapeHTML(post.text)}</p>
      ${post.image ? `<img src="${escapeHTML(post.image)}" class="post-image" alt="Bild" loading="lazy">` : ''}
      <div class="post-actions">
        <button class="action-btn ${schonGeliket ? 'liked' : ''}" onclick="toggleLike('${post._id}', ${schonGeliket})">
          ❤️ ${post.likes.length}
        </button>
        <button class="action-btn" onclick="toggleKommentare('${post._id}')">
          💬 ${post.comments.length}
        </button>
        ${eigenerPost ? `<button class="action-btn delete" onclick="deletePost('${post._id}')">🗑️ Löschen</button>` : ''}
      </div>
      <div id="kommentare-${post._id}" class="comments-section" style="display:none">
        <div id="kommentar-liste-${post._id}">${kommentare}</div>
        <div class="comment-compose">
          <input id="k-input-${post._id}" type="text" placeholder="Kommentieren…" maxlength="500"
            onkeydown="if(event.key==='Enter') addKommentar('${post._id}')" />
          <button onclick="addKommentar('${post._id}')">Senden</button>
        </div>
      </div>
    </div>`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderPosts() {
  const container = document.getElementById('posts-container');
  container.innerHTML = '<p class="loading">Beiträge werden geladen…</p>';
  try {
    const posts = await api('/posts');
    if (posts.length === 0) {
      container.innerHTML = '<p class="leer">Noch keine Beiträge. Sei der/die Erste!</p>';
      return;
    }
    container.innerHTML = posts.map(p =>
      postHTML(p, currentUser && p.user?._id === currentUser._id)
    ).join('');
  } catch (err) {
    container.innerHTML = `<p class="error">Fehler beim Laden: ${err.message}</p>`;
  }
}

async function renderUserPosts() {
  const container = document.getElementById('user-posts-container');
  if (!container) return;
  try {
    const posts = await api(`/users/${currentUser.username}/posts`);
    container.innerHTML = posts.length === 0
      ? '<p class="leer">Noch keine eigenen Beiträge.</p>'
      : posts.map(p => postHTML(p, true)).join('');
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function createPost() {
  const textarea = document.getElementById('post-text');
  const text = textarea.value.trim();
  if (!text) { alert('Bitte Text eingeben.'); return; }

  try {
    await api('/posts', { method: 'POST', body: JSON.stringify({ text }) });
    textarea.value = '';
    document.getElementById('char-count').textContent = '0 / 1000';
    renderPosts();
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
}

async function toggleLike(postId, schonGeliket) {
  try {
    await api(`/posts/${schonGeliket ? 'unlike' : 'like'}/${postId}`, { method: 'PUT' });
    renderPosts();
  } catch (err) {
    alert(err.message);
  }
}

async function deletePost(postId) {
  if (!confirm('Beitrag wirklich löschen?')) return;
  try {
    await api(`/posts/${postId}`, { method: 'DELETE' });
    renderPosts();
    renderUserPosts();
  } catch (err) {
    alert(err.message);
  }
}

function toggleKommentare(postId) {
  const div = document.getElementById(`kommentare-${postId}`);
  div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

async function addKommentar(postId) {
  const input = document.getElementById(`k-input-${postId}`);
  const text  = input.value.trim();
  if (!text) return;

  try {
    const kommentare = await api(`/posts/comment/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    input.value = '';
    const liste = document.getElementById(`kommentar-liste-${postId}`);
    liste.innerHTML = kommentare.map(k => `
      <div class="comment">
        <span>${k.user?.emoji || '🎓'}</span>
        <div><span class="comment-author">${escapeHTML(k.user?.name || '')}</span>
        &nbsp;${escapeHTML(k.text)}</div>
      </div>
    `).join('');
  } catch (err) {
    alert(err.message);
  }
}

// ── Zeichenzähler ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('post-text');
  if (textarea) {
    textarea.addEventListener('input', () => {
      document.getElementById('char-count').textContent = `${textarea.value.length} / 1000`;
    });
  }

  if (token) {
    ladeAktuellenBenutzer()
      .then(() => showMainPage())
      .catch(() => { logout(); showLogin(); });
  } else {
    showLogin();
  }
});
