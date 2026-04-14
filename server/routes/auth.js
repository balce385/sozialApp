const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', [
  check('name',     'Name ist erforderlich').not().isEmpty(),
  check('username', 'Benutzername ist erforderlich').not().isEmpty(),
  check('email',    'Gültige E-Mail erforderlich').isEmail(),
  check('password', 'Passwort muss mindestens 6 Zeichen haben').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username, email, password } = req.body;

  try {
    const vorhanden = await User.findOne({ $or: [{ username }, { email }] });
    if (vorhanden) {
      return res.status(400).json({ msg: 'Benutzername oder E-Mail bereits vergeben' });
    }

    const user = new User({ name, username, email, password });
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// POST /api/auth/login
router.post('/login', [
  check('username', 'Benutzername ist erforderlich').not().isEmpty(),
  check('password', 'Passwort ist erforderlich').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Ungültige Anmeldedaten' });
    }

    const stimmt = await user.comparePassword(password);
    if (!stimmt) {
      return res.status(400).json({ msg: 'Ungültige Anmeldedaten' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

module.exports = router;
