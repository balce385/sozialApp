// Globale Variablen
let currentUser = null;
let token = localStorage.getItem('token');

// API Base URL: liest aus config.js (BACKEND_URL = Render-URL), sonst relativ
const API_URL = (window.BACKEND_URL || '') + '/api';

// DOM Elemente
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const mainPage = document.getElementById('main-page');

// Login Funktion
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Bitte Benutzername und Passwort eingeben');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Login fehlgeschlagen');
    }

    localStorage.setItem('token', data.token);
    token = data.token;

    await getCurrentUser();
    showMainPage();
  } catch (err) {
    alert('Registrierung fehlgeschlagen: ' + err.message);
  }
}

// Registrierung Funktion
async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name || !username || !email || !password) {
    alert('Bitte alle Felder ausfüllen');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Registrierung fehlgeschlagen');
    }

    localStorage.setItem('token', data.token);
    token = data.token;

    await getCurrentUser();
    showMainPage();
  } catch (err) {
    if (err.name === 'TypeError') {
      alert('Netzwerkfehler – Server nicht erreichbar.\nBackend: ' + API_URL);
    } else {
      alert('Registrierung fehlgeschlagen: ' + err.message);
    }
  }
}

// Aktuellen Benutzer abrufen
async function getCurrentUser() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { 'x-auth-token': token }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Benutzerdaten konnten nicht abgerufen werden');
    }

    currentUser = data;
    return data;
  } catch (err) {
    console.error(err);
    logout();
  }
}

// Logout Funktion
function logout() {
  localStorage.removeItem('token');
  token = null;
  currentUser = null;
  showLogin();
}

// Login-Seite anzeigen
function showLogin() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  loginPage.classList.add('active');
}

// Registrierungs-Seite anzeigen
function showRegister() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  registerPage.classList.add('active');
}

// Hauptseite anzeigen
async function showMainPage() {
  if (!token) {
    showLogin();
    return;
  }

  try {
    if (!currentUser) {
      await getCurrentUser();
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    mainPage.classList.add('active');

    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-username').textContent = '@' + currentUser.username;
    document.getElementById('profile-avatar').textContent = currentUser.emoji;
    document.getElementById('followers-count').textContent = currentUser.followers.length;
    document.getElementById('following-count').textContent = currentUser.following.length;

    showPage('feed');
    renderPosts();
  } catch (err) {
    console.error(err);
    logout();
  }
}

// Unterseite anzeigen
function showPage(page) {
  document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`${page}-page`);
  if (target) target.classList.add('active');

  if (page === 'profile') {
    renderUserPosts();
  }
}

// Posts rendern
async function renderPosts() {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      headers: { 'x-auth-token': token }
    });

    const posts = await response.json();

    if (!response.ok) {
      throw new Error(posts.msg || 'Posts konnten nicht geladen werden');
    }

    const container = document.getElementById('posts-container');
    container.innerHTML = posts.map(post => `
      <div class="post">
        <div class="post-header">
          <div class="post-avatar">${post.user.emoji}</div>
          <div class="post-info">
            <h4>${post.user.name}</h4>
            <p>@${post.user.username}</p>
          </div>
        </div>
        <p class="post-text">${post.text}</p>
        ${post.image ? `<img src="${post.image}" class="post-image" alt="Post Image">` : ''}
        <div class="post-actions">
          <button class="action-btn" onclick="likePost('${post._id}')">❤️ ${post.likes.length}</button>
          <button class="action-btn">💬 ${post.comments.length}</button>
          <button class="action-btn">↗️ Teilen</button>
          ${post.user._id === currentUser._id ?
            `<button class="action-btn" onclick="deletePost('${post._id}')" style="color:red">🗑️ Löschen</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Posts konnten nicht geladen werden');
  }
}

// Post erstellen
async function createPost() {
  const text = document.getElementById('post-text').value.trim();
  if (!text) {
    alert('Bitte Text eingeben');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ text })
    });

    const post = await response.json();

    if (!response.ok) {
      throw new Error(post.msg || 'Post konnte nicht erstellt werden');
    }

    document.getElementById('post-text').value = '';
    renderPosts();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Post liken
async function likePost(postId) {
  try {
    const response = await fetch(`${API_URL}/posts/like/${postId}`, {
      method: 'PUT',
      headers: { 'x-auth-token': token }
    });

    const likes = await response.json();

    if (!response.ok) {
      throw new Error(likes.msg || 'Like konnte nicht hinzugefügt werden');
    }

    renderPosts();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Post löschen
async function deletePost(postId) {
  if (!confirm('Post wirklich löschen?')) return;

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Post konnte nicht gelöscht werden');
    }

    renderPosts();
    renderUserPosts();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Benutzerposts rendern
async function renderUserPosts() {
  if (!currentUser) return;

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.username}/posts`, {
      headers: { 'x-auth-token': token }
    });

    const posts = await response.json();

    if (!response.ok) {
      throw new Error(posts.msg || 'Posts konnten nicht geladen werden');
    }

    const container = document.getElementById('user-posts-container');
    container.innerHTML = posts.length === 0
      ? '<p style="text-align:center; color:#888; padding:20px">Noch keine Posts</p>'
      : posts.map(post => `
        <div class="post">
          <p class="post-text">${post.text}</p>
          <div class="post-actions">
            <button class="action-btn">❤️ ${post.likes.length}</button>
            <button class="action-btn">💬 ${post.comments.length}</button>
            <button class="action-btn" onclick="deletePost('${post._id}')" style="color:red">🗑️ Löschen</button>
          </div>
        </div>
      `).join('');
  } catch (err) {
    console.error(err);
    alert('Posts konnten nicht geladen werden');
  }
}

// Profil aktualisieren
async function updateProfile() {
  const name = document.getElementById('profile-name-input').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  const emoji = document.getElementById('profile-emoji').value.trim();

  if (!name) {
    alert('Bitte Namen eingeben');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ name, bio, emoji })
    });

    const user = await response.json();

    if (!response.ok) {
      throw new Error(user.msg || 'Profil konnte nicht aktualisiert werden');
    }

    currentUser = user;
    showMainPage();
    alert('Profil erfolgreich aktualisiert!');
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showMainPage();
  } else {
    showLogin();
  }
});
