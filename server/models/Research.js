const mongoose = require('mongoose');

const libraryItemSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  author:      { type: String, required: true },
  year:        { type: Number, required: true },
  category:    { type: String, required: true },
  publisher:   { type: String, required: true },
  description: { type: String, required: true },
  pages:       { type: Number, required: true }
});

const caseStudySchema = new mongoose.Schema({
  title:        { type: String, required: true },
  category:     { type: String, required: true },
  alter:        { type: String, required: true },
  emoji:        { type: String, required: true },
  situation:    { type: String, required: true },
  problem:      { type: String, required: true },
  intervention: { type: String, required: true },
  ergebnis:     { type: String, required: true },
  dauer:        { type: String, required: true }
});

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true }
});

const groupSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  members: { type: Number, required: true },
  icon:    { type: String, required: true },
  topic:   { type: String, required: true }
});

const mentorSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  fach:      { type: String, required: true },
  emoji:     { type: String, required: true },
  verfuegbar: { type: Boolean, required: true }
});

const resourceSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  link: { type: String, required: true }
});

module.exports = {
  LibraryItem: mongoose.model('LibraryItem', libraryItemSchema),
  CaseStudy:   mongoose.model('CaseStudy',   caseStudySchema),
  Flashcard:   mongoose.model('Flashcard',   flashcardSchema),
  Group:       mongoose.model('Group',       groupSchema),
  Mentor:      mongoose.model('Mentor',      mentorSchema),
  Resource:    mongoose.model('Resource',    resourceSchema)
};
