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
        default: 900 // 15 minutes
    },
    score: {
        type: mongoose.Schema.Types.Decimal128
    },
    riskLevelIndicator: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    }
}, { timestamps: true });

const PersonalityTest = mongoose.model('PersonalityTest', personalityTestSchema, 'personality_tests');

module.exports = PersonalityTest;