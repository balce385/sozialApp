const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// Post erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { text, image } = req.body;
    const newPost = new Post({ user: req.user.id, text, image });
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

    // deleteOne() statt post.remove() (Mongoose 7+)
    await post.deleteOne();
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
    post.comments.unshift({ user: req.user.id, text });
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serverfehler');
  }
});

module.exports = router;
