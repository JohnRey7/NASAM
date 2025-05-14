const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApplicationForm',
        required: true,
        index: true
    },
    gradeReport: {
        filePath: { type: String, required: true }, // Path or URL to the file
        originalName: { type: String, required: true }, // Original file name
        uploadedAt: { type: Date, default: Date.now }
    },
    incomeTaxReturn: {
        filePath: { type: String, required: true }, // Path or URL to the file
        originalName: { type: String, required: true }, // Original file name
        uploadedAt: { type: Date, default: Date.now }
    },
    certificates: [{
        filePath: { type: String, required: true }, // Path or URL to the file
        originalName: { type: String, required: true }, // Original file name
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const DocumentUpload = mongoose.model('DocumentUpload', fileUploadSchema);

module.exports = DocumentUpload;
