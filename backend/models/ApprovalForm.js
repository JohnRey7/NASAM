const mongoose = require('mongoose');

const acceptanceFormSchema = new mongoose.Schema({
  applicationForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationForm',
    required: true,
    index: true
  },
  to: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  endorsedBy: { type: String },
  departmentOfficeHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const AcceptanceForm = mongoose.model('AcceptanceForm', acceptanceFormSchema);

module.exports = AcceptanceForm;