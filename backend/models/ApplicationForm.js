const mongoose = require('mongoose');

const applicationFormSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
    enum: ['<100k', '100k-200k', '200k-300k', '300k-400k', '400k-500k', '>500k'],
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
      name: { type: String, required: true },
      age: {
        type: Number,
        required: true,
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
        required: true,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      },
      firstSemesterAverageFinalGrade: { type: Number, required: true },
      secondSemesterAverageFinalGrade: { type: Number, required: true },
      thirdSemesterAverageFinalGrade: { type: Number }
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
  approvalsSummary: {
    interviewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    endorsedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });


const ApplicationForm = mongoose.model('ApplicationForm', applicationFormSchema);

module.exports = ApplicationForm;