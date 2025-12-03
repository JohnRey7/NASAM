const mongoose = require('mongoose');

// Draft schema - all fields are optional to allow partial saves
const applicationDraftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Only one draft per user
    index: true
  },
  currentStep: { type: Number, default: 1 },
  
  // All fields are optional for drafts
  shsgraduateCIT: { type: Boolean },
  emailAddress: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  suffix: { type: String },
  birthDate: { type: Date },
  programOfStudyAndYear: { type: String },
  existingScholarship: { type: String },
  remainingUnitsIncludingThisTerm: { type: Number },
  remainingTermsToGraduate: { type: Number },
  citizenship: { type: String },
  civilStatus: { type: String },
  annualFamilyIncome: { type: String },
  currentResidenceAddress: { type: String },
  residingAt: { type: String },
  permanentResidentialAddress: { type: String },
  contactNumber: { type: String },
  gender: { type: String },
  
  // Eligibility fields
  isCitUSeniorHighGraduate: { type: Boolean },
  yearLevel: { type: String },
  citUResidency: {
    semesterCount: { type: Number },
    weightedAverageGrade: { type: Number },
    hasFailingMarks: { type: Boolean },
    minimumUnitsCompleted: { type: Number }
  },
  
  // Family Background - stored as mixed type for flexibility
  familyBackground: {
    father: {
      firstName: { type: String },
      middleName: { type: String },
      lastName: { type: String },
      suffix: { type: String },
      age: { type: Number },
      occupation: { type: String },
      grossAnnualIncome: { type: String },
      companyName: { type: String },
      companyAddress: { type: String },
      homeAddress: { type: String },
      contactNumber: { type: String }
    },
    mother: {
      firstName: { type: String },
      middleName: { type: String },
      lastName: { type: String },
      suffix: { type: String },
      age: { type: Number },
      occupation: { type: String },
      grossAnnualIncome: { type: String },
      companyName: { type: String },
      companyAddress: { type: String },
      homeAddress: { type: String },
      contactNumber: { type: String }
    },
    siblings: [{
      name: { type: String },
      age: { type: Number },
      programCurrentlyTakingOrFinished: { type: String },
      schoolOrOccupation: { type: String }
    }]
  },
  
  // Education
  education: {
    elementary: {
      nameAndAddressOfSchool: { type: String },
      honorOrAwardsReceived: { type: String },
      nameOfOrganizationAndPositionHeld: { type: String },
      generalAverage: { type: Number },
      rankAmongGraduates: { type: String },
      contestTrainingsConferencesParticipated: { type: String }
    },
    secondary: {
      nameAndAddressOfSchool: { type: String },
      honorOrAwardsReceived: { type: String },
      nameOfOrganizationAndPositionHeld: { type: String },
      generalAverage: { type: Number },
      rankAmongGraduates: { type: String },
      contestTrainingsConferencesParticipated: { type: String }
    },
    collegeLevel: [{
      yearLevel: { type: Number },
      firstSemesterAverageFinalGrade: { type: Number },
      secondSemesterAverageFinalGrade: { type: Number },
      thirdSemesterAverageFinalGrade: { type: Number }
    }],
    currentMembershipInOrganizations: [{
      nameOfOrganization: { type: String },
      position: { type: String }
    }]
  },
  
  // References
  references: [{
    name: { type: String },
    relationshipToTheApplicant: { type: String },
    contactNumber: { type: String }
  }]
}, { 
  timestamps: true,
  // Automatically delete drafts after 30 days of inactivity
  expireAfterSeconds: 30 * 24 * 60 * 60
});

// Create index for TTL (Time To Live) on updatedAt field
applicationDraftSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ApplicationDraft = mongoose.model('ApplicationDraft', applicationDraftSchema);

module.exports = ApplicationDraft;
