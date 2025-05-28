const mongoose = require('mongoose');
const ApplicationForm = require('../models/ApplicationForm');
const User = require('../models/User');

const ApplicationController = {
  // Create a new application form for the authenticated user
  async createApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const existingApplication = await ApplicationForm.findOne({ user: userId });
      if (existingApplication) {
        return res.status(409).json({ message: 'User already filled an application' });
      }

      // Get user's email from the User model
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent approvalsSummary from being set
      if (req.body.approvalsSummary) {
        return res.status(400).json({ message: 'Cannot set approvalsSummary during creation' });
      }

      // Parse JSON data if sent as string in form-data
      const formData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

      // Extract and validate required fields
      const {
        firstName, lastName,
        programOfStudyAndYear, remainingUnitsIncludingThisTerm, remainingTermsToGraduate,
        citizenship, civilStatus, annualFamilyIncome, residingAt, permanentResidentialAddress,
        contactNumber, familyBackground, education, references,
        middleName, suffix, existingScholarship, currentResidenceAddress
      } = formData;

      // Validate required top-level fields
      if (!firstName || !lastName ||
          !programOfStudyAndYear || !remainingUnitsIncludingThisTerm || !remainingTermsToGraduate ||
          !citizenship || !civilStatus || !annualFamilyIncome || !residingAt ||
          !permanentResidentialAddress || !contactNumber) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate familyBackground
      if (!familyBackground || !familyBackground.father || !familyBackground.mother) {
        return res.status(400).json({ message: 'familyBackground.father and familyBackground.mother are required' });
      }
      const { father, mother } = familyBackground;
      if (!father.firstName || !father.lastName || !father.age || !father.occupation ||
          !father.grossAnnualIncome || !father.contactNumber ||
          !mother.firstName || !mother.lastName || !mother.age || !mother.occupation ||
          !mother.grossAnnualIncome || !mother.contactNumber) {
        return res.status(400).json({ message: 'Missing required familyBackground fields' });
      }

      // Validate education
      if (!education || !education.elementary || !education.secondary) {
        return res.status(400).json({ message: 'education.elementary and education.secondary are required' });
      }
      if (!education.elementary.nameAndAddressOfSchool || !education.elementary.generalAverage ||
          !education.secondary.nameAndAddressOfSchool || !education.secondary.generalAverage) {
        return res.status(400).json({ message: 'Missing required education fields' });
      }

      const applicationData = {
        user: userId,
        emailAddress: user.email,
        firstName,
        middleName,
        lastName,
        suffix,
        programOfStudyAndYear,
        existingScholarship,
        remainingUnitsIncludingThisTerm,
        remainingTermsToGraduate,
        citizenship,
        civilStatus,
        annualFamilyIncome,
        currentResidenceAddress,
        residingAt,
        permanentResidentialAddress,
        contactNumber,
        familyBackground,
        education,
        references
      };

      const application = new ApplicationForm(applicationData);
      await application.save();
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Get the application form for the authenticated user
  async getMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationForm.findOne({ user: userId })
        .populate({
          path: 'user',
          select: 'name role _id'
        })
        .populate({
          path: 'approvalsSummary.interviewedBy',
          select: 'name role _id'
        })
        .populate({
          path: 'approvalsSummary.endorsedBy',
          select: 'name role _id'
        })
        .populate({
          path: 'approvalsSummary.approvedBy',
          select: 'name role _id'
        });
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a specific application form by ID (for admins or owner)
  async getApplicationFormById(req, res) {
    try {
      const application = await ApplicationForm.findById(req.params.id)
        .populate({
          path: 'user',
          select: '_id name role'
        })
        .populate({
          path: 'approvalsSummary.interviewedBy',
          select: '_id name role'
        })
        .populate({
          path: 'approvalsSummary.endorsedBy',
          select: '_id name role'
        })
        .populate({
          path: 'approvalsSummary.approvedBy',
          select: '_id name role'
        });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAllApplicationForms(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 25);
      const skip = (page - 1) * limit;

      const filter = {};
      const queryFields = req.query;

      const objectIdFields = [
        '_id',
        'user',
        'approvalsSummary.interviewedBy',
        'approvalsSummary.endorsedBy',
        'approvalsSummary.approvedBy'
      ];

      for (const key in queryFields) {
        if (key !== 'page' && key !== 'limit') {
          if (objectIdFields.includes(key)) {
            if (!mongoose.Types.ObjectId.isValid(queryFields[key])) {
              return res.status(400).json({ message: `Invalid ObjectId for ${key}: ${queryFields[key]}` });
            }
            filter[key] = queryFields[key];
          } else {
            filter[key] = queryFields[key];
          }
        }
      }

      if (queryFields.firstName) {
        filter.firstName = new RegExp(queryFields.firstName, 'i');
      }
      if (queryFields.lastName) {
        filter.lastName = new RegExp(queryFields.lastName, 'i');
      }

      const applications = await ApplicationForm.find(filter)
        .populate({
          path: 'user',
          select: '_id name role'
        })
        .populate({
          path: 'approvalsSummary.interviewedBy',
          select: '_id name role'
        })
        .populate({
          path: 'approvalsSummary.endorsedBy',
          select: '_id name role'
        })
        .populate({
          path: 'approvalsSummary.approvedBy',
          select: '_id name role'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ApplicationForm.countDocuments(filter);

      res.json({
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update the authenticated user's application form
  async updateMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (req.body.approvalsSummary) {
        return res.status(400).json({ message: 'Cannot update approvalsSummary' });
      }

      const formData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

      const {
        firstName, middleName, lastName, suffix, programOfStudyAndYear, existingScholarship,
        remainingUnitsIncludingThisTerm, remainingTermsToGraduate, citizenship,
        civilStatus, annualFamilyIncome, currentResidenceAddress, residingAt,
        permanentResidentialAddress, contactNumber, familyBackground, education,
        references
      } = formData;

      Object.assign(application, {
        firstName,
        middleName,
        lastName,
        suffix,
        programOfStudyAndYear,
        existingScholarship,
        remainingUnitsIncludingThisTerm,
        remainingTermsToGraduate,
        citizenship,
        civilStatus,
        annualFamilyIncome,
        currentResidenceAddress,
        residingAt,
        permanentResidentialAddress,
        contactNumber,
        familyBackground,
        education,
        references
      });

      await application.save();
      res.json(application);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Update a specific application form (admin only)
  async updateApplicationForm(req, res) {
    try {
      const application = await ApplicationForm.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const formData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

      const {
        firstName, middleName, lastName, suffix, programOfStudyAndYear, existingScholarship,
        remainingUnitsIncludingThisTerm, remainingTermsToGraduate, citizenship,
        civilStatus, annualFamilyIncome, currentResidenceAddress, residingAt,
        permanentResidentialAddress, contactNumber, familyBackground, education,
        references, approvalsSummary
      } = formData;

      // Validate approvalsSummary if provided
      if (approvalsSummary) {
        const { interviewedBy, endorsedBy, approvedBy } = approvalsSummary;

        if (interviewedBy) {
          if (!Array.isArray(interviewedBy)) {
            return res.status(400).json({ message: 'approvalsSummary.interviewedBy must be an array' });
          }
          for (const userId of interviewedBy) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
              return res.status(400).json({ message: `Invalid User ID in interviewedBy: ${userId}` });
            }
            const user = await User.findById(userId);
            if (!user) {
              return res.status(400).json({ message: `User not found for ID in interviewedBy: ${userId}` });
            }
          }
        }

        if (endorsedBy) {
          if (!mongoose.Types.ObjectId.isValid(endorsedBy)) {
            return res.status(400).json({ message: `Invalid User ID in endorsedBy: ${endorsedBy}` });
          }
          const user = await User.findById(endorsedBy);
          if (!user) {
            return res.status(400).json({ message: `User not found for ID in endorsedBy: ${endorsedBy}` });
          }
        }

        if (approvedBy) {
          if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
            return res.status(400).json({ message: `Invalid User ID in approvedBy: ${approvedBy}` });
          }
          const user = await User.findById(approvedBy);
          if (!user) {
            return res.status(400).json({ message: `User not found for ID in approvedBy: ${approvedBy}` });
          }
        }
      }

      Object.assign(application, {
        firstName,
        middleName,
        lastName,
        suffix,
        programOfStudyAndYear,
        existingScholarship,
        remainingUnitsIncludingThisTerm,
        remainingTermsToGraduate,
        citizenship,
        civilStatus,
        annualFamilyIncome,
        currentResidenceAddress,
        residingAt,
        permanentResidentialAddress,
        contactNumber,
        familyBackground,
        education,
        references,
        approvalsSummary
      });

      await application.save();
      res.json(application);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete a specific application form (admin only)
  async deleteApplicationForm(req, res) {
    try {
      const application = await ApplicationForm.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      await ApplicationForm.deleteOne({ _id: req.params.id });
      res.json({ message: 'Application deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

// Export without file upload middleware
module.exports = {
  createApplicationForm: ApplicationController.createApplicationForm,
  getMyApplicationForm: ApplicationController.getMyApplicationForm,
  getApplicationFormById: ApplicationController.getApplicationFormById,
  getAllApplicationForms: ApplicationController.getAllApplicationForms,
  updateMyApplicationForm: ApplicationController.updateMyApplicationForm,
  updateApplicationForm: ApplicationController.updateApplicationForm,
  deleteApplicationForm: ApplicationController.deleteApplicationForm
};