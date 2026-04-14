const express = require('express');
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
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
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
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

module.exports = router;
