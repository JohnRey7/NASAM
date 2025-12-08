const mongoose = require('mongoose');

const personalityTestSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApplicationForm',
        required: true,
        index: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityAssessmentTemplate'
    }],
    answers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityAssessmentAnswers',
    }],
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    timeLimitSeconds: {
        type: Number,
        default: 300 // 5 minutes
    },
    score: {
        type: mongoose.Schema.Types.Decimal128
    },
    riskLevelIndicator: {
        type: String,
        enum: ['Very Low', 'Low', 'Below Average', 'Average', 'Above Average'],
        default: 'Average'
    },
    reviewed: {
        type: Boolean,
        default: false
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

const PersonalityTest = mongoose.model('PersonalityTest', personalityTestSchema, 'personality_tests');

module.exports = PersonalityTest;