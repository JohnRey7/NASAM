const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApplicationForm',
        required: true,
        index: true,
        unique: true
    },
    studentPicture: {
        filePath: { type: String }, 
        originalName: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    },
    nbiClearance: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    gradeReport: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    incomeTaxReturn: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    goodMoralCertificate: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    physicalCheckup: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    certificates: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    homeLocationSketch: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],

}, { timestamps: true });

const DocumentUpload = mongoose.model('DocumentUpload', fileUploadSchema);

module.exports = DocumentUpload;