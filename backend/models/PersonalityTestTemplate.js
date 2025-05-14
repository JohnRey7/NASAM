const mongoose = require('mongoose');

const personalityAssessmentTemplateSchema = new mongoose.Schema({
    type: { type: String, required: true },
    question: { type: String, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, { timestamps: true });

const PersonalityAssessmentTemplate = mongoose.model('PersonalityAssessmentTemplate', personalityAssessmentTemplateSchema);

module.exports = PersonalityAssessmentTemplate;
