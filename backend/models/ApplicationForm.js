const mongoose = require('mongoose');

const applicationFormSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['M', 'F'], required: true },
    completeAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    emailAddress: { 
        type: String, 
        required: true, 
        unique: true, 
        match: [/.+\@.+\..+/, 'Please enter a valid email address'] 
    },
    currentYearLevel: { 
        type: Number, 
        required: true,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    currentGPA: { type: Number, required: true },
    previousSchoolAttended: { type: String, required: true },
    academicAchievements: { type: String },
    hadScholarship: { type: Boolean, required: true },
    annualFamilyIncome: { 
        type: String, 
        enum: ['<100k', '100k-200k', '200k-300k', '300k-400k', '400k-500k', '>500k'], 
        required: true 
    },
    numberOfFamilyMembers: { 
        type: Number, 
        required: true,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    numberOfWorkingFamilyMembers: { 
        type: Number, 
        required: true,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    financialStatement: { type: String },
    currentlyEmployed: { type: Boolean, required: true },
}, { timestamps: true });

const ApplicationForm = mongoose.model('ApplicationForm', applicationFormSchema);

module.exports = ApplicationForm;
