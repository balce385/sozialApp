const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  const { name, bio, emoji } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ msg: 'Name ist erforderlich' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: name.trim(), bio, emoji } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// GET /api/users/:username/posts
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    const posts = await Post.find({ user: user.id })
      .populate('user', ['name', 'username', 'emoji'])
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// PUT /api/users/follow/:id
router.put('/follow/:id', auth, async (req, res) => {
  try {
    const ziel = await User.findById(req.params.id);
    const ich  = await User.findById(req.user.id);
    if (!ziel) return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: 'Du kannst dir nicht selbst folgen' });
    }
    if (ich.following.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Du folgst diesem Benutzer bereits' });
    }
    ich.following.push(req.params.id);
    ziel.followers.push(req.user.id);
    await ich.save();
    await ziel.save();
    res.json({ msg: 'Erfolgreich gefolgt' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

// PUT /api/users/unfollow/:id
router.put('/unfollow/:id', auth, async (req, res) => {
  try {
    const ziel = await User.findById(req.params.id);
    const ich  = await User.findById(req.user.id);
    if (!ziel) return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    if (!ich.following.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Du folgst diesem Benutzer nicht' });
    }
    ich.following  = ich.following.filter(id => id.toString() !== req.params.id);
    ziel.followers = ziel.followers.filter(id => id.toString() !== req.user.id);
    await ich.save();
    await ziel.save();
    res.json({ msg: 'Erfolgreich entfolgt' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

module.exports = router;
