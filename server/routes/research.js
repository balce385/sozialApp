const express = require('express');
const router = express.Router();
const { LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource } = require('../models/Research');

// GET /api/research/library
router.get('/library', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { author:      { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await LibraryItem.find(query).sort({ year: -1 });
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/research/cases
router.get('/cases', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const cases = await CaseStudy.find(query);
    res.json(cases);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/research/flashcards
router.get('/flashcards', async (req, res) => {
  try {
    const cards = await Flashcard.find();
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/research/groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/research/mentors
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find();
    res.json(mentors);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/research/resources
router.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

module.exports = router;
