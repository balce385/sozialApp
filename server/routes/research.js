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
    const query = category ? { category } : {};
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
    const cards = await Flashcard.find().sort({ isUserCreated: 1, createdAt: 1 });
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Eigene Lernkarte erstellen
router.post('/flashcards', auth, async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ msg: 'Frage und Antwort erforderlich.' });
  }
  try {
    const card = new Flashcard({
      question: question.trim(),
      answer: answer.trim(),
      createdBy: req.user.id,
      isUserCreated: true
    });
    await card.save();
    res.status(201).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

// Eigene Lernkarte löschen
router.delete('/flashcards/:id', auth, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ msg: 'Karte nicht gefunden.' });
    if (!card.isUserCreated || card.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Keine Berechtigung.' });
    }
    await card.deleteOne();
    res.json({ msg: 'Karte gelöscht.' });
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
