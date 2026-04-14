const express = require('express');
const router = express.Router();
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
