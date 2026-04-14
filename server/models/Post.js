const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:  { type: String, required: true, maxlength: 1000 },
  image: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text:      { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
