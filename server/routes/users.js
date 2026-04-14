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
