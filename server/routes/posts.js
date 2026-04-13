const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// POST /api/posts – Beitrag erstellen
router.post('/', auth, async (req, res) => {
  const { text, image } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ msg: 'Text ist erforderlich' });
  }

  try {
    const post = new Post({ user: req.user.id, text: text.trim(), image });
    await post.save();
    await post.populate('user', ['name', 'username', 'emoji']);
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/posts – Feed (alle Beiträge)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', ['name', 'username', 'emoji'])
      .populate('comments.user', ['name', 'username', 'emoji'])
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// DELETE /api/posts/:id – Eigenen Beitrag löschen
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Beitrag nicht gefunden' });
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Nicht autorisiert' });
    }
    await post.deleteOne();
    res.json({ msg: 'Beitrag gelöscht' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// PUT /api/posts/like/:id
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Beitrag nicht gefunden' });
    if (post.likes.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Beitrag bereits geliket' });
    }
    post.likes.unshift(req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// PUT /api/posts/unlike/:id
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Beitrag nicht gefunden' });
    if (!post.likes.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Beitrag noch nicht geliket' });
    }
    post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// POST /api/posts/comment/:id
router.post('/comment/:id', auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ msg: 'Kommentartext fehlt' });
  }
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Beitrag nicht gefunden' });
    post.comments.unshift({ user: req.user.id, text: text.trim() });
    await post.save();
    await post.populate('comments.user', ['name', 'username', 'emoji']);
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

module.exports = router;
