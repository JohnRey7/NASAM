const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  evaluateeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attendanceAndPunctuality: {
    regularAttendance: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'regularAttendance must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    promptnessInReportingForDuty: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'promptnessInReportingForDuty must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    }
  },
  qualityOfWorkOutput: {
    accuracyAndThoroughnessOfWork: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'accuracyAndThoroughnessOfWork must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    organizationAndOrPresentationNeatnessOfWork: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'organizationAndOrPresentationNeatnessOfWork must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    effectiveness: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'effectiveness must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    }
  },
  quantityOfWorkOutput: {
    accomplishesMoreWorkOnTheGivenTime: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'accomplishesMoreWorkOnTheGivenTime must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    timelinessInAccomplishingTaskDuties: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'timelinessInAccomplishingTaskDuties must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    }
  },
  attitudeAndWorkBehavior: {
    senseOfResponsibilityAndUrgency: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'senseOfResponsibilityAndUrgency must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    dependabilityAndReliability: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'dependabilityAndReliability must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    industryAndResourcefulness: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'industryAndResourcefulness must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    alertnessAndInitiative: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'alertnessAndInitiative must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    },
    sociabilityAndPleasantDisposition: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: value => value >= 0 && value <= 5,
        message: 'sociabilityAndPleasantDisposition must be between 0 and 5'
      },
      get: v => v ? parseFloat(v.toString()) : v
    }
  },
  remarksAndRecommendationByImmediateSupervisor: {
    type: String,
    required: false
  },
  remarksCommentsByTheNAS: {
    type: String,
    required: false
  },
  timeKeepingRecord: {
    excusedAbsences: {
      type: Number,
      required: true,
      validate: {
        validator: value => Number.isInteger(value) && value >= 0,
        message: 'excusedAbsences must be a non-negative integer'
      },
      default: 0
    },
    unexcusedAbsences: {
      type: Number,
      required: true,
      validate: {
        validator: value => Number.isInteger(value) && value >= 0,
        message: 'unexcusedAbsences must be a non-negative integer'
      },
      default: 0
    },
    lateGreaterThanTenMinutes: {
      type: Number,
      required: true,
      validate: {
        validator: value => Number.isInteger(value) && value >= 0,
        message: 'lateGreaterThanTenMinutes must be a non-negative integer'
      },
      default: 0
    },
    lateGreaterThanOneHour: {
      type: Number,
      required: true,
      validate: {
        validator: value => Number.isInteger(value) && value >= 0,
        message: 'lateGreaterThanOneHour must be a non-negative integer'
      },
      default: 0
    },
    failureToPunch: {
      type: Number,
      required: true,
      validate: {
        validator: value => Number.isInteger(value) && value >= 0,
        message: 'failureToPunch must be a non-negative integer'
      },
      default: 0
    },
    underTime: {
      type: Number,
      required: true,
      validate: {
        validator: value => Number.isInteger(value) && value >= 0,
        message: 'underTime must be a non-negative integer'
      },
      default: 0
    }
  },
  overallRating: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    validate: {
      validator: value => value >= 0 && value <= 5,
      message: 'overallRating must be between 0 and 5'
    },
    get: v => v ? parseFloat(v.toString()) : v
  }
}, { 
  timestamps: true,
  indexes: [
    { key: { evaluateeUser: 1, createdAt: -1 } }
  ]
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema, 'evaluations');

module.exports = Evaluation;