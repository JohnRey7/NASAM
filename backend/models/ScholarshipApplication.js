const mongoose = require('mongoose');

const scholarshipApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    studentPicture: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    typeOfScholarship: {
        type: String,
        required: true
    },
    nameOfScholarshipSponsor: {
        type: String,
        required: true
    },
    programOfStudyAndYear: {
        type: String,
        required: true
    },
    remainingUnitsIncludingThisTerm: {
        type: Number,
        required: true,
        min: 0
    },
    remainingTermsToGraduate: {
        type: Number,
        required: true,
        min: 0
    },
    citizenship: {
        type: String,
        required: true
    },
    civilStatus: {
        type: String,
        required: true,
        enum: ['Single', 'Married', 'Widowed', 'Separated']
    },
    annualFamilyIncome: {
        type: String,
        required: true
    },
    residingAt: {
        type: String,
        required: true
    },
    permanentResidentialAddress: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    familyBackground: {
        father: {
            firstName: {
                type: String,
                required: true
            },
            lastName: {
                type: String,
                required: true
            },
            age: {
                type: Number,
                required: true,
                min: 0
            },
            occupation: {
                type: String,
                required: true
            },
            grossAnnualIncome: {
                type: String,
                required: true
            },
            contactNumber: {
                type: String,
                required: true
            }
        },
        mother: {
            firstName: {
                type: String,
                required: true
            },
            lastName: {
                type: String,
                required: true
            },
            age: {
                type: Number,
                required: true,
                min: 0
            },
            occupation: {
                type: String,
                required: true
            },
            grossAnnualIncome: {
                type: String,
                required: true
            },
            contactNumber: {
                type: String,
                required: true
            }
        },
        siblings: [{
            name: {
                type: String,
                required: true
            },
            age: {
                type: Number,
                required: true,
                min: 0
            }
        }]
    },
    education: {
        elementary: {
            nameAndAddressOfSchool: {
                type: String,
                required: true
            },
            generalAverage: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        },
        secondary: {
            nameAndAddressOfSchool: {
                type: String,
                required: true
            },
            generalAverage: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        },
        collegeLevel: [{
            yearLevel: {
                type: Number,
                required: true,
                min: 1
            },
            firstSemesterAverageFinalGrade: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            },
            secondSemesterAverageFinalGrade: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        }]
    },
    currentMembershipInOrganizations: [{
        nameOfOrganization: {
            type: String,
            required: true
        },
        position: {
            type: String,
            required: true
        }
    }],
    references: [{
        name: {
            type: String,
            required: true
        },
        relationshipToTheApplicant: {
            type: String,
            required: true
        },
        contactNumber: {
            type: String,
            required: true
        }
    }],
    approvalsSummary: {
        interviewedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
scholarshipApplicationSchema.index({ user: 1 });
scholarshipApplicationSchema.index({ typeOfScholarship: 1 });
scholarshipApplicationSchema.index({ 'approvalsSummary.interviewedBy': 1 });

const ScholarshipApplication = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);

module.exports = ScholarshipApplication; 