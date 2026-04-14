const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  username:       { type: String, required: true, unique: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  bio:            { type: String, default: 'Soziale Arbeit Studierende*r' },
  emoji:          { type: String, default: '🎓' },
  profilePicture: { type: String, default: '' },
  followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt:      { type: Date, default: Date.now }
});

// Passwort vor dem Speichern hashen
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Passwort vergleichen
userSchema.methods.comparePassword = async function (kandidat) {
  return bcrypt.compare(kandidat, this.password);
};

module.exports = mongoose.model('User', userSchema);
