const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationForm',
    required: true,
    index: true
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['OAS', 'DepartmentHead'],
    default: 'OAS'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  /**
   * is_finished is added so that we can track if the interview has been conducted or not.  
   */
  is_finished: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure one interview per type per application, but allow multiple deleted ones
interviewSchema.index(
  { applicationId: 1, type: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { is_deleted: false } 
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;