const mongoose = require('mongoose');

const scholarEvaluationSchema = new mongoose.Schema({
  // Scholar Information
  scholar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scholarName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  
  // Evaluation Period
  ratingPeriod: {
    type: String,
    required: true // e.g., "First Semester S.Y. 2024-2025"
  },
  semester: {
    type: String,
    required: true,
    enum: ['First Semester', 'Second Semester', 'Summer']
  },
  schoolYear: {
    type: String,
    required: true // e.g., "2024-2025"
  },
  
  // Evaluator Information
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluatorName: {
    type: String,
    required: true
  },
  evaluatorPosition: {
    type: String,
    required: true
  },
  
  // A. ATTENDANCE AND PUNCTUALITY (20%)
  attendanceAndPunctuality: {
    regularityOfAttendance: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    promptnessInReporting: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  
  // B. QUALITY OF WORK OUTPUT (25%)
  qualityOfWorkOutput: {
    accuracyAndThoroughness: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    organizationAndPresentation: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    effectiveness: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  
  // C. QUANTITY OF WORK OUTPUT (15%)
  quantityOfWorkOutput: {
    accomplishesMoreWork: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    readinessInAccomplishing: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  
  // D. PERSONAL QUALITIES (25%)
  personalQualities: {
    responsibilityAndUrgency: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    dependabilityAndReliability: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    industryAndResourcefulness: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    fairnessAndInitiative: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    sociabilityAndDisposition: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  
  // E. OVERALL RATING (Auto-calculated)
  overallRating: {
    type: Number,
    required: true
  },
  interpretation: {
    type: String,
    required: true,
    enum: ['Very Good', 'Good', 'Average', 'Poor', 'Very Poor']
  },
  
  // TIMEKEEPING RECORD
  timekeepingRecord: {
    excusedAbsences: {
      type: Number,
      default: 0
    },
    unexcusedAbsences: {
      type: Number,
      default: 0
    },
    lateMoreThan10mins: {
      type: Number,
      default: 0
    },
    lateLessThan1hr: {
      type: Number,
      default: 0
    },
    failureToPunch: {
      type: Number,
      default: 0
    },
    underTime: {
      type: Number,
      default: 0
    }
  },
  
  // REMARKS
  supervisorRemarks: {
    type: String,
    default: ''
  },
  nasRemarks: {
    type: String,
    default: ''
  },
  
  // Acknowledgment
  acknowledgedByScholar: {
    type: Boolean,
    default: false
  },
  acknowledgmentDate: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'acknowledged'],
    default: 'submitted'
  },
  
  // Soft Delete
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate overall rating before saving
scholarEvaluationSchema.pre('save', function(next) {
  // A. Attendance and Punctuality (20%)
  const attendanceAvg = (
    this.attendanceAndPunctuality.regularityOfAttendance +
    this.attendanceAndPunctuality.promptnessInReporting
  ) / 2;
  const attendanceScore = attendanceAvg * 0.20;
  
  // B. Quality of Work Output (25%)
  const qualityAvg = (
    this.qualityOfWorkOutput.accuracyAndThoroughness +
    this.qualityOfWorkOutput.organizationAndPresentation +
    this.qualityOfWorkOutput.effectiveness
  ) / 3;
  const qualityScore = qualityAvg * 0.25;
  
  // C. Quantity of Work Output (15%)
  const quantityAvg = (
    this.quantityOfWorkOutput.accomplishesMoreWork +
    this.quantityOfWorkOutput.readinessInAccomplishing
  ) / 2;
  const quantityScore = quantityAvg * 0.15;
  
  // D. Personal Qualities (25%)
  const personalAvg = (
    this.personalQualities.responsibilityAndUrgency +
    this.personalQualities.dependabilityAndReliability +
    this.personalQualities.industryAndResourcefulness +
    this.personalQualities.fairnessAndInitiative +
    this.personalQualities.sociabilityAndDisposition
  ) / 5;
  const personalScore = personalAvg * 0.25;
  
  // E. Overall Rating (remaining 15% is implicit)
  this.overallRating = attendanceScore + qualityScore + quantityScore + personalScore;
  
  // Determine interpretation
  if (this.overallRating >= 4.5) {
    this.interpretation = 'Very Good';
  } else if (this.overallRating >= 3.5) {
    this.interpretation = 'Good';
  } else if (this.overallRating >= 2.5) {
    this.interpretation = 'Average';
  } else if (this.overallRating >= 1.5) {
    this.interpretation = 'Poor';
  } else {
    this.interpretation = 'Very Poor';
  }
  
  next();
});

// Indexes for better query performance
scholarEvaluationSchema.index({ scholar: 1, ratingPeriod: 1 });
scholarEvaluationSchema.index({ evaluatedBy: 1 });
scholarEvaluationSchema.index({ department: 1 });
scholarEvaluationSchema.index({ semester: 1, schoolYear: 1 });
scholarEvaluationSchema.index({ is_deleted: 1 });

const ScholarEvaluation = mongoose.model('ScholarEvaluation', scholarEvaluationSchema);

module.exports = ScholarEvaluation;
