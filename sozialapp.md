/sozialapp
├── client/                  # Frontend
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── research.html
│   ├── research.css
│   ├── research.js
│   └── assets/              # Bilder, Icons
├── server/                  # Backend
│   ├── models/              # Datenbankmodelle
│   ├── routes/              # API-Routen
│   ├── middleware/          # Auth-Middleware
│   ├── config/              # Konfigurationen
│   ├── app.js               # Express-App
│   └── server.js            # Server-Einrichtung
├── package.json
└── README.md
{
  "name": "sozialapp-backend",
  "version": "1.0.0",
  "description": "Backend für SozialApp",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "multer": "^1.4.5-lts.1",
    "validator": "^13.9.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Datenbankverbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
const express = require('express');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const researchRoutes = require('./routes/research');
const userRoutes = require('./routes/users');

const app = express();

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/users', userRoutes);

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Etwas ist schiefgelaufen!');
});

module.exports = app;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: 'Soziale Arbeit Student' },
  emoji: { type: String, default: '■' },
  profilePicture: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Passwort-Hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Passwort-Vergleich
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  image: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
const mongoose = require('mongoose');

const libraryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  category: { type: String, required: true },
  publisher: { type: String, required: true },
  description: { type: String, required: true },
  pages: { type: Number, required: true }
});

const caseStudySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  alter: { type: String, required: true },
  emoji: { type: String, required: true },
  situation: { type: String, required: true },
  problem: { type: String, required: true },
  intervention: { type: String, required: true },
  ergebnis: { type: String, required: true },
  dauer: { type: String, required: true }
});

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: { type: Number, required: true },
  icon: { type: String, required: true },
  topic: { type: String, required: true }
});

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fach: { type: String, required: true },
  emoji: { type: String, required: true },
  verfuegbar: { type: Boolean, required: true }
});

const resourceSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  link: { type: String, required: true }
});

module.exports = {
  LibraryItem: mongoose.model('LibraryItem', libraryItemSchema),
  CaseStudy: mongoose.model('CaseStudy', caseStudySchema),
  Flashcard: mongoose.model('Flashcard', flashcardSchema),
  Group: mongoose.model('Group', groupSchema),
  Mentor: mongoose.model('Mentor', mentorSchema),
  Resource: mongoose.model('Resource', resourceSchema)
};const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Registrierung
router.post('/register', [
  check('name').not().isEmpty(),
  check('username').not().isEmpty(),
  check('email').isEmail(),
  check('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, username, email, password } = req.body;

    // Überprüfen, ob Benutzer existiert
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ msg: 'Benutzer existiert bereits' });
    }

    // Neuen Benutzer erstellen
    user = new User({ name, username, email, password });
    await user.save();

    // JWT erstellen
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Login
router.post('/login', [
  check('username').not().isEmpty(),
  check('password').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;

    // Benutzer finden
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Ungültige Anmeldedaten' });
    }

    // Passwort überprüfen
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Ungültige Anmeldedaten' });
    }

    // JWT erstellen
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

// Post erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { text, image } = req.body;
    const newPost = new Post({
      user: req.user.id,
      text,
      image
    });
    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Alle Posts abrufen (Feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', ['name', 'username', 'emoji'])
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Post löschen
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post nicht gefunden' });
    }

    // Überprüfen, ob Benutzer der Besitzer ist
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Nicht autorisiert' });
    }

    await post.remove();
    res.json({ msg: 'Post gelöscht' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Post liken
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Überprüfen, ob Post bereits geliked wurde
    if (post.likes.some(like => like.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post bereits geliked' });
    }

    post.likes.unshift(req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Post unliken
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Überprüfen, ob Post nicht geliked wurde
    if (!post.likes.some(like => like.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post wurde noch nicht geliked' });
    }

    post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Kommentar hinzufügen
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    const newComment = {
      user: req.user.id,
      text
    };

    post.comments.unshift(newComment);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  LibraryItem,
  CaseStudy,
  Flashcard,
  Group,
  Mentor,
  Resource
} = require('../models/Research');

// Bibliothek-Daten abrufen
router.get('/library', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await LibraryItem.find(query);
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Fallstudien abrufen
router.get('/cases', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    const cases = await CaseStudy.find(query);
    res.json(cases);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Lernkarten abrufen
router.get('/flashcards', async (req, res) => {
  try {
    const cards = await Flashcard.find();
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Netzwerk-Gruppen abrufen
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Mentoren abrufen
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find();
    res.json(mentors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Ressourcen abrufen
router.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

// Benutzerprofil abrufen
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Benutzerprofil aktualisieren
router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio, emoji } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, bio, emoji } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Benutzerposts abrufen
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    }

    const posts = await Post.find({ user: user.id })
      .populate('user', ['name', 'username', 'emoji'])
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Benutzer folgen
router.put('/follow/:id', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    }

    // Überprüfen, ob bereits gefolgt wird
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Du folgst diesem Benutzer bereits' });
    }

    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user.id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ msg: 'Erfolgreich gefolgt' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Benutzer entfolgen
router.put('/unfollow/:id', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    }

    // Überprüfen, ob nicht gefolgt wird
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Du folgst diesem Benutzer nicht' });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ msg: 'Erfolgreich entfolgt' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

module.exports = router;
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Token aus Header abrufen
  const token = req.header('x-auth-token');

  // Überprüfen, ob Token existiert
  if (!token) {
    return res.status(401).json({ msg: 'Kein Token, Autorisierung verweigert' });
  }

  // Token verifizieren
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token ist nicht gültig' });
  }
};// Globale Variablen
let currentUser = null;
let token = localStorage.getItem('token');

// API Base URL
const API_URL = 'https://sozialapp-backend.herokuapp.com/api';

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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Login fehlgeschlagen');
    }

    // Token speichern
    localStorage.setItem('token', data.token);
    token = data.token;

    // Benutzerdaten abrufen
    await getCurrentUser();

    // Hauptseite anzeigen
    showMainPage();
  } catch (err) {
    alert(err.message);
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Registrierung fehlgeschlagen');
    }

    // Token speichern
    localStorage.setItem('token', data.token);
    token = data.token;

    // Benutzerdaten abrufen
    await getCurrentUser();

    // Hauptseite anzeigen
    showMainPage();
  } catch (err) {
    alert(err.message);
  }
}

// Aktuellen Benutzer abrufen
async function getCurrentUser() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'x-auth-token': token
      }
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

    // Seiten umschalten
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    mainPage.classList.add('active');

    // Benutzerdaten anzeigen
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-username').textContent = '@' + currentUser.username;
    document.getElementById('profile-avatar').textContent = currentUser.emoji;
    document.getElementById('followers-count').textContent = currentUser.followers.length;
    document.getElementById('following-count').textContent = currentUser.following.length;

    // Feed laden
    showPage('feed');
    renderPosts();
  } catch (err) {
    console.error(err);
    logout();
  }
}

// Posts rendern
async function renderPosts() {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      headers: {
        'x-auth-token': token
      }
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
          <button class="action-btn" onclick="likePost('${post._id}')">
            ❤■ ${post.likes.length}
          </button>
          <button class="action-btn">■ ${post.comments.length}</button>
          <button class="action-btn">■ Teilen</button>
          ${post.user._id === currentUser._id ?
            `<button class="action-btn" onclick="deletePost('${post._id}')" style="color:red">■■ Löschen</button>` : ''}
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

    // Textfeld leeren und Posts neu laden
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
      headers: {
        'x-auth-token': token
      }
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
      headers: {
        'x-auth-token': token
      }
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
  try {
    const response = await fetch(`${API_URL}/users/${currentUser.username}/posts`, {
      headers: {
        'x-auth-token': token
      }
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
            <button class="action-btn">❤■ ${post.likes.length}</button>
            <button class="action-btn">■ ${post.comments.length}</button>
            <button class="action-btn" onclick="deletePost('${post._id}')" style="color:red">■■ Löschen</button>
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
// Globale Variablen
let currentCardIndex = 0;
let cardFlipped = false;
let timerInterval = null;
let timerMinutes = 25;
let timerSeconds = 0;
let timerRunning = false;

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
  const category = document.querySelector('.filter-btn.active').dataset.category;

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
  libraryResults.innerHTML = items.map(item => `
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
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
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

    // Erste Karte anzeigen
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
  flipCard(false); // Karte zurücksetzen
}

// Nächste Karte
function nextCard() {
  loadFlashcards().then(cards => {
    const newIndex = (currentCardIndex + 1) % cards.length;
    showCard(newIndex, cards);
  });
}

// Vorherige Karte
function prevCard() {
  loadFlashcards().then(cards => {
    const newIndex = (currentCardIndex - 1 + cards.length) % cards.length;
    showCard(newIndex, cards);
  });
}

// Karte umdrehen
function flipCard(flip = !cardFlipped) {
  cardFlipped = flip;
  flashcard.style.transform = cardFlipped ? 'rotateY(180deg)' : 'rotateY(0)';
}

// Timer starten
function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds === 0) {
      if (timerMinutes === 0) {
        resetTimer();
        alert('Lernsession beendet!');
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
  timerDisplay.textContent = `${timerMinutes.toString().padStart(2, '0')}:${timerSeconds.toString().padStart(2, '0')}`;
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

  let apa = type === 'buch'
    ? `${author} (${year}). ${title}. ${publisher}.`
    : `${author} (${year}). ${title}. ${publisher}.`;

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

// Noten berechnen
function calculateGrade() {
  const exams = parseInt(document.getElementById('exam-count').value);
  const weight = parseInt(document.getElementById('exam-weight').value);
  const grade = parseFloat(document.getElementById('exam-grade').value);

  if (isNaN(exams) || isNaN(weight) || isNaN(grade)) {
    alert('Bitte gültige Werte eingeben!');
    return;
  }

  const totalWeight = exams * weight;
  const totalPoints = grade * weight * exams;
  const average = totalPoints / totalWeight;

  const result = document.getElementById('grade-result');
  result.innerHTML = `
    <strong>Berechnung:</strong><br>
    ${exams} Prüfungen × ${weight}% = ${totalWeight}%<br>
    Gesamtpunktzahl: ${totalPoints}<br>
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
        <p>${mentor.verfuegbar ? 'Verfügbar' : 'Nicht verfügbar'}</p>
      </div>
      ${mentor.verfuegbar ?
        `<button class="contact-btn" onclick="contactMentor('${mentor.name}')">Kontakt</button>` :
        `<button class="contact-btn" disabled>Nicht verfügbar</button>`}
    </div>
  `).join('');
}

// Mentor kontaktieren
function contactMentor(name) {
  alert(`Kontaktanfrage an ${name} gesendet! ■`);
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

// Ressourcen rendern
function renderResources(resources) {
  resourcesGrid.innerHTML = resources.map(resource => `
    <div class="resource-card">
      <div class="res-icon">${resource.icon}</div>
      <h4>${resource.name}</h4>
      <p>${resource.desc}</p>
      <a href="${resource.link}" target="_blank">Besuchen</a>
    </div>
  `).join('');
}

// Tab anzeigen
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
  document.getElementById(`${tab}-tab`).classList.add('active');

  // Daten laden, wenn Tab aktiviert wird
  switch(tab) {
    case 'library':
      searchLibrary();
      break;
    case 'cases':
      loadCaseStudies();
      break;
    case 'tools':
      loadFlashcards();
      break;
    case 'network':
      loadGroups();
      loadMentors();
      break;
    case 'resources':
      loadResources();
      break;
  }
}

// Initialisierung
window.onload = function() {
  // Timer initialisieren
  updateTimerDisplay();

  // Standard-Tab anzeigen
  showTab('library');
};
require('dotenv').config();
const mongoose = require('mongoose');
const {
  LibraryItem,
  CaseStudy,
  Flashcard,
  Group,
  Mentor,
  Resource
} = require('./models/Research');

// Daten
const libraryData = [
  { title: 'Grundriss Soziale Arbeit', author: 'Thole, W.', year: 2012, category: 'sozialarbeit',
    publisher: 'VS Verlag', description: 'Standardwerk der Sozialen Arbeit', pages: 1064 },
  // ... restliche Bibliothekseinträge
];

const casesData = [
  { title: 'Jugendlicher mit Schulverweigerung', category: 'jugend', alter: '15 Jahre', emoji: '■',
    situation: 'Kevin besucht seit 3 Monaten nicht mehr die Schule.',
    problem: 'Schulverweigerung, soziale Isolation, familiäre Konflikte',
    intervention: 'Einzelberatung, Familienberatung, Kooperation mit Schule',
    ergebnis: 'Schrittweise Wiedereingliederung', dauer: '6 Monate' },
  // ... restliche Fallstudien
];

const flashcards = [
  { question: 'Was ist Soziale Arbeit?', answer: 'Profession und Wissenschaft, die sozialen Wandel, Problemloesung und Empowerment foerdert. Grundsaetze: Menschenrechte und soziale Gerechtigkeit.' },
  // ... restliche Lernkarten
];

const groupsData = [
  { name: 'Kinder & Jugendhilfe Studis', members: 34, icon: '■', topic: 'SGB VIII, Fallarbeit, Praktikum' },
  // ... restliche Gruppen
];

const mentorsData = [
  { name: 'Prof. Dr. Mueller', fach: 'Sozialrecht & Sozialpolitik', emoji: '■■■', verfuegbar: true },
  // ... restliche Mentoren
];

const resourcesData = [
  { icon: '■', name: 'DBSH', desc: 'Deutscher Berufsverband für Soziale Arbeit', link: 'https://www.dbsh.de' },
  // ... restliche Ressourcen
];

// Datenbankverbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB verbunden');

    // Daten löschen und neu einfügen
    await LibraryItem.deleteMany({});
    await CaseStudy.deleteMany({});
    await Flashcard.deleteMany({});
    await Group.deleteMany({});
    await Mentor.deleteMany({});
    await Resource.deleteMany({});

    await LibraryItem.insertMany(libraryData);
    await CaseStudy.insertMany(casesData);
    await Flashcard.insertMany(flashcards);
    await Group.insertMany(groupsData);
    await Mentor.insertMany(mentorsData);
    await Resource.insertMany(resourcesData);

    console.log('Daten erfolgreich initialisiert');
    process.exit();
  })
  .catch(err => {
    console.error('Fehler:', err);
    process.exit(1);
  });


