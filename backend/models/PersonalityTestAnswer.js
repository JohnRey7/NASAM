const mongoose = require('mongoose');

const personalityAssessmentAnswersSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApplicationForm',
        required: true,
        index: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityAssessmentTemplate',
        required: true,
        index: true
    },
    answer: { type: String, required: true }
}, { timestamps: true });

const PersonalityAssessmentAnswers = mongoose.model('PersonalityAssessmentAnswers', personalityAssessmentAnswersSchema, 'personality_assessment_answers');

module.exports = PersonalityAssessmentAnswers;
