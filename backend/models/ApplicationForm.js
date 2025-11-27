const mongoose = require('mongoose');

const applicationFormSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }, // I was about to add is_college when an earthquake happened
  // is_college: { type: Boolean, default: true },
  shsgraduateCIT: { type: Boolean, required: true },
  emailAddress: {
    type: String,
    sparse: true,  // This allows multiple null values
    index: true
  },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  suffix: { type: String },
  programOfStudyAndYear: { type: String, required: true },
  existingScholarship: { type: String },
  remainingUnitsIncludingThisTerm: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  remainingTermsToGraduate: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  citizenship: { type: String, required: true },
  civilStatus: { type: String, required: true },
  annualFamilyIncome: {
    type: String,
    enum: ['<100k', '100k-200k', '200k-300k', '>300k'],
    required: true
  },
  currentResidenceAddress: { type: String },
  residingAt: {
    type: String,
    enum: ['Boarding House', "Parent's House", "Relative's House"],
    required: true
  },
  permanentResidentialAddress: { type: String, required: true },
  contactNumber: { type: String, required: true },
  
  // New fields for eligibility validation based on SRS
  isCitUSeniorHighGraduate: { type: Boolean, required: true },
  yearLevel: {
    type: String,
    enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year'],
    required: true
  },
  // For Non-CIT-U graduates - residency requirements
  citUResidency: {
    semesterCount: { type: Number }, // Number of semesters completed at CIT-U
    weightedAverageGrade: { type: Number }, // Must be >= 3.5
    hasFailingMarks: { type: Boolean },
    minimumUnitsCompleted: { type: Number } // 15 for regular, 6 for summer
  },
  
  familyBackground: {
    father: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String, required: true },
      suffix: { type: String },
      age: {
        type: Number,
        required: true,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      },
      occupation: { type: String, required: true },
      grossAnnualIncome: { type: String, required: true },
      companyName: { type: String },
      companyAddress: { type: String },
      homeAddress: { type: String },
      contactNumber: { type: String, required: true }
    },
    mother: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String, required: true },
      suffix: { type: String },
      age: {
        type: Number,
        required: true,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      },
      occupation: { type: String, required: true },
      grossAnnualIncome: { type: String, required: true },
      companyName: { type: String },
      companyAddress: { type: String },
      homeAddress: { type: String },
      contactNumber: { type: String, required: true }
    },
    siblings: [{
      name: { type: String, required: false },
      age: {
        type: Number,
        required: false,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      },
      programCurrentlyTakingOrFinished: { type: String },
      schoolOrOccupation: { type: String }
    }]
  },
  education: {
    elementary: {
      nameAndAddressOfSchool: { type: String, required: true },
      honorOrAwardsReceived: { type: String },
      nameOfOrganizationAndPositionHeld: { type: String },
      generalAverage: { type: Number, required: true },
      rankAmongGraduates: { type: String },
      contestTrainingsConferencesParticipated: { type: String }
    },
    secondary: {
      nameAndAddressOfSchool: { type: String, required: true },
      honorOrAwardsReceived: { type: String },
      nameOfOrganizationAndPositionHeld: { type: String },
      generalAverage: { type: Number, required: true },
      rankAmongGraduates: { type: String },
      contestTrainingsConferencesParticipated: { type: String }
    },
    collegeLevel: [{
      yearLevel: {
        type: Number,
        required: false,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      },
      firstSemesterAverageFinalGrade: { type: Number, required: false },
      secondSemesterAverageFinalGrade: { type: Number, required: false },
      thirdSemesterAverageFinalGrade: { type: Number, required: false }
    }],
    currentMembershipInOrganizations: [{
      nameOfOrganization: { type: String, required: true },
      position: { type: String, required: true }
    }]
  },
  references: [{
    name: { type: String, required: true },
    relationshipToTheApplicant: { type: String, required: true },
    contactNumber: { type: String, required: true }
  }],
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: false,
      index: true
    },
  status: {
    type: String,
    enum: ['pending', 'form_verified', 'document_verification', 'interview_scheduled', 'approved', 'rejected'],
    default: 'pending'
  },
  // Application form verification fields
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Document verification fields
  documentsVerifiedAt: { type: Date },
  documentsVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  approvalsSummary: {
    endorsedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  assignedDepartment: { type: String },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });


const ApplicationForm = mongoose.model('ApplicationForm', applicationFormSchema);

module.exports = ApplicationForm;