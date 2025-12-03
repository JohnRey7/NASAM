const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
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
    gradeAverages: {
        elementary: { type: Number, min: 0, max: 100 },
        juniorHighSchool: { type: Number, min: 0, max: 100 },
        seniorHighSchool: { type: Number, min: 0, max: 100 },
        college: { type: Number, min: 0, max: 100 } // Optional
    },
    incomeTaxReturn: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    incomeTaxInfo: {
        annualIncome: { type: Number },
        taxableIncome: { type: Number },
        taxYear: { type: String },
        employerName: { type: String },
        tin: { type: String } // Tax Identification Number
    },
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
    // End of semester updated grade on AIMS
    endTermSemesterGrade: [{
        filePath: { type: String, required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        gradeSubjects: [
            {
                subjectCode: { type: String, required: true },
                subjectTitle: { type: String, required: true },
                units: { type: Number, required: false },
                grade: { type: String, required: true }
            }
        ]
    }],
    // Semester Start time and End time (4-5 months) (in order)
    semesterDuration: [{
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    }],
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    is_deleted: { type: Boolean, default: false }

}, { timestamps: true });

const DocumentUpload = mongoose.model('DocumentUpload', fileUploadSchema);

module.exports = DocumentUpload;