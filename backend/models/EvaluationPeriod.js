const mongoose = require('mongoose');

const evaluationPeriodSchema = new mongoose.Schema({
  // Period Information
  semester: {
    type: String,
    required: true,
    enum: ['First Semester', 'Second Semester', 'Summer']
  },
  schoolYear: {
    type: String,
    required: true // e.g., "2024-2025"
  },
  ratingPeriod: {
    type: String,
    required: true // e.g., "First Semester S.Y. 2024-2025"
  },
  
  // Status
  isOpen: {
    type: Boolean,
    default: false
  },
  
  // Dates
  openedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  
  // Admin who opened/closed
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  totalEvaluations: {
    type: Number,
    default: 0
  },
  totalScholars: {
    type: Number,
    default: 0
  },
  
  // Notes
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Only one period can be open at a time
evaluationPeriodSchema.index({ isOpen: 1 }, { unique: true, partialFilterExpression: { isOpen: true } });

// Unique combination of semester and school year
evaluationPeriodSchema.index({ semester: 1, schoolYear: 1 }, { unique: true });

const EvaluationPeriod = mongoose.model('EvaluationPeriod', evaluationPeriodSchema);

module.exports = EvaluationPeriod;
