const mongoose = require('mongoose');

const panelistSchema = new mongoose.Schema({
  evaluatorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  evaluation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    default: null
  }
}, { timestamps: true });

const Panelist = mongoose.model('Panelist', panelistSchema, 'panelists');

module.exports = Panelist;