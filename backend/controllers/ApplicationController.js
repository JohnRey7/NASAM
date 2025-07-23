const ApplicationForm = require('../models/ApplicationForm');
const ApplicationHistory = require('../models/ApplicationHistory');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const ActivityLogger = require('../services/ActivityLogger');
const NotificationService = require('../services/NotificationService');

// Helper function to format yearLevel for display
const formatYearLevel = (yearLevel) => {
  if (!yearLevel) return 'N/A';
  const year = Math.floor(yearLevel);
  const isSummer = yearLevel % 1 !== 0;
  return isSummer ? `${year}th Year Summer` : `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`;
};

// Helper function to generate PDF from ApplicationForm
async function generateApplicationPDF(application, templatePath) {
  let browser = null;
  try {
    let template;
    try {
      template = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load PDF template: ${error.message}`);
    }

    const data = {
      firstName: application.firstName || '',
      middleName: application.middleName || 'N/A',
      lastName: application.lastName || '',
      suffix: application.suffix || 'N/A',
      emailAddress: application.emailAddress || 'N/A',
      programOfStudyAndYear: application.programOfStudyAndYear || '',
      existingScholarship: application.existingScholarship || 'N/A',
      remainingUnits: application.remainingUnitsIncludingThisTerm || 0,
      remainingUnitsIncludingThisTerm: application.remainingUnitsIncludingThisTerm || 0,
      remainingTermsToGraduate: application.remainingTermsToGraduate || 0,
      citizenship: application.citizenship || '',
      civilStatus: application.civilStatus || '',
      annualFamilyIncome: application.annualFamilyIncome || '',
      currentAddress: application.currentResidenceAddress || 'N/A',
      residingAt: application.residingAt || '',
      permanentResidence: application.permanentResidentialAddress || '',
      contactNumber: application.contactNumber || '',
      family: {
        father: {
          firstName: application.familyBackground?.father?.firstName || '',
          middleName: application.familyBackground?.father?.middleName || 'N/A',
          lastName: application.familyBackground?.father?.lastName || '',
          suffix: application.familyBackground?.father?.suffix || 'N/A',
          age: application.familyBackground?.father?.age || 0,
          occupation: application.familyBackground?.father?.occupation || '',
          grossAnnualIncome: application.familyBackground?.father?.grossAnnualIncome || '',
          companyName: application.familyBackground?.father?.companyName || 'N/A',
          companyAddress: application.familyBackground?.father?.companyAddress || 'N/A',
          homeAddress: application.familyBackground?.father?.homeAddress || 'N/A',
          contactNumber: application.familyBackground?.father?.contactNumber || ''
        },
        mother: {
          firstName: application.familyBackground?.mother?.firstName || '',
          middleName: application.familyBackground?.mother?.middleName || 'N/A',
          lastName: application.familyBackground?.mother?.lastName || '',
          suffix: application.familyBackground?.mother?.suffix || 'N/A',
          age: application.familyBackground?.mother?.age || 0,
          occupation: application.familyBackground?.mother?.occupation || '',
          grossAnnualIncome: application.familyBackground?.mother?.grossAnnualIncome || '',
          companyName: application.familyBackground?.mother?.companyName || 'N/A',
          companyAddress: application.familyBackground?.mother?.companyAddress || 'N/A',
          homeAddress: application.familyBackground?.mother?.homeAddress || 'N/A',
          contactNumber: application.familyBackground?.mother?.contactNumber || ''
        },
        siblings: application.familyBackground?.siblings || []
      },
      education: {
        elementary: {
          nameAndAddressOfSchool: application.education?.elementary?.nameAndAddressOfSchool || '',
          honorOrAwardsReceived: application.education?.elementary?.honorOrAwardsReceived || 'N/A',
          nameOfOrganizationAndPositionHeld: application.education?.elementary?.nameOfOrganizationAndPositionHeld || 'N/A',
          generalAverage: application.education?.elementary?.generalAverage || 0,
          rankAmongGraduates: application.education?.elementary?.rankAmongGraduates || 'N/A',
          contestTrainingsConferencesParticipated: application.education?.elementary?.contestTrainingsConferencesParticipated || 'N/A'
        },
        secondary: {
          nameAndAddressOfSchool: application.education?.secondary?.nameAndAddressOfSchool || '',
          honorOrAwardsReceived: application.education?.secondary?.honorOrAwardsReceived || 'N/A',
          nameOfOrganizationAndPositionHeld: application.education?.secondary?.nameOfOrganizationAndPositionHeld || 'N/A',
          generalAverage: application.education?.secondary?.generalAverage || 0,
          rankAmongGraduates: application.education?.secondary?.rankAmongGraduates || 'N/A',
          contestTrainingsConferencesParticipated: application.education?.secondary?.contestTrainingsConferencesParticipated || 'N/A'
        },
        collegeLevel: (application.education?.collegeLevel || []).map(item => ({
          yearLevel: formatYearLevel(item.yearLevel),
          firstSemesterAverageFinalGrade: item.firstSemesterAverageFinalGrade || 0,
          secondSemesterAverageFinalGrade: item.secondSemesterAverageFinalGrade || 0,
          thirdSemesterAverageFinalGrade: item.thirdSemesterAverageFinalGrade || 0
        })),
        currentMembershipInOrganizations: application.education?.currentMembershipInOrganizations || []
      },
      references: application.references || []
    };

    let html = template;

    const escapeHtml = (str) => {
      const value = str ?? 'N/A';
      return String(value).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m]);
    };

    const replaceScalar = (key, value) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), escapeHtml(value));
      html = html.replace(new RegExp(`{{{${key}}}}`, 'g'), String(value ?? 'N/A'));
    };

    for (const key in data) {
      if (typeof data[key] === 'string' || typeof data[key] === 'number') {
        replaceScalar(key, data[key]);
      }
    }

    for (const parent of ['father', 'mother']) {
      for (const field in data.family[parent]) {
        replaceScalar(`family.${parent}.${field}`, data.family[parent][field]);
      }
    }

    for (const level of ['elementary', 'secondary']) {
      for (const field in data.education[level]) {
        replaceScalar(`education.${level}.${field}`, data.education[level][field]);
      }
    }

    const arraySections = [
      {
        key: 'family.siblings',
        regex: /{{#each family\.siblings}}([\s\S]*?){{\/each}}/,
        fields: ['name', 'age', 'programCurrentlyTakingOrFinished', 'schoolOrOccupation']
      },
      {
        key: 'education.collegeLevel',
        regex: /{{#each education\.collegeLevel}}([\s\S]*?){{\/each}}/,
        fields: ['yearLevel', 'firstSemesterAverageFinalGrade', 'secondSemesterAverageFinalGrade', 'thirdSemesterAverageFinalGrade']
      },
      {
        key: 'education.currentMembershipInOrganizations',
        regex: /{{#each education\.currentMembershipInOrganizations}}([\s\S]*?){{\/each}}/,
        fields: ['nameOfOrganization', 'position']
      },
      {
        key: 'references',
        regex: /{{#each references}}([\s\S]*?){{\/each}}/,
        fields: ['name', 'relationshipToTheApplicant', 'contactNumber']
      }
    ];

    for (const { key, regex, fields } of arraySections) {
      const match = html.match(regex);
      if (match) {
        const template = match[1];
        let content = '';
        const items = key.split('.').reduce((obj, k) => obj?.[k] || [], data);
        if (items.length) {
          items.forEach(item => {
            let temp = template;
            fields.forEach(field => {
              temp = temp.replace(new RegExp(`{{${field}}}`, 'g'), escapeHtml(item[field]));
              temp = temp.replace(new RegExp(`{{{${field}}}}`, 'g'), String(item[field] ?? 'N/A'));
            });
            content += temp;
          });
        } else {
          content = `<p class="no-data">No ${key.split('.').pop()} listed.</p>`;
        }
        html = html.replace(regex, content);
      }
    }

    html = html.replace(/{{#if ([^}]+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, (match, condition, ifContent, elseContent) => {
      const path = condition.split('.');
      const value = path.reduce((obj, k) => obj?.[k], data);
      return value && (Array.isArray(value) ? value.length : value) ? ifContent : elseContent;
    });

    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close().catch(err => console.error('Error closing browser:', err.message));
    }
  }
}

const ApplicationController = {
  // POST: Create a new application for the authenticated user
  async createApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const data = { ...req.body };

      delete data.status;
      delete data.approvalsSummary;

      const existingApplication = await ApplicationForm.findOne({ user: userId });
      if (existingApplication) {
        return res.status(400).json({ message: 'User already has an application' });
      }

      const application = new ApplicationForm({
        user: userId,
        ...data
      });

      await application.save();

      // 🔥 ADD: Log application submission
      await ActivityLogger.logApplicationSubmission(
        userId, 
        application._id, 
        data.typeOfScholarship || 'scholarship'
      );

      // 🎯 CREATE NOTIFICATION HERE
      await NotificationService.createApplicationSubmittedNotification(
        req.user.id,
        application._id
      );

      const applicationResponse = await ApplicationForm.findById(application._id)
        .select('-status -approvalsSummary');

      res.status(201).json({
        message: 'Application created successfully',
        application: applicationResponse
      });
    } catch (error) {
      console.error('Error in createApplicationForm:', error);
      res.status(400).json({ message: `Failed to create application: ${error.message}` });
    }
  },

  // GET: Read application by ID (admin)
  async readApplicationFormById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      const application = await ApplicationForm.findById(id)
        .populate('user', 'name idNumber _id')
        .populate('approvalsSummary.endorsedBy', 'name _id')
        .populate('approvalsSummary.approvedBy', 'name _id');

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({
        message: 'Application retrieved successfully',
        application
      });
    } catch (error) {
      console.error('Error in readApplicationFormById:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Read application by user ID (admin)
  async readApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const application = await ApplicationForm.findOne({ user: userId })
        .populate('user', 'name idNumber _id')
        .populate('approvalsSummary.endorsedBy', 'name _id')
        .populate('approvalsSummary.approvedBy', 'name _id');

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({
        message: 'Application retrieved successfully',
        application
      });
    } catch (error) {
      console.error('Error in readApplicationFormByUserId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Read the authenticated user's application
  async readMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;

      const application = await ApplicationForm.findOne({ user: userId });

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({
        message: 'Application retrieved successfully',
        application
      });
    } catch (error) {
      console.error('Error in readMyApplicationForm:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve all applications with pagination and filtering
  async getAllApplicationForms(req, res) {
    try {
      const { page = 1, limit = 10, firstName, emailAddress, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};
      if (firstName) query.firstName = { $regex: firstName, $options: 'i' };
      if (emailAddress) query.emailAddress = { $regex: emailAddress, $options: 'i' };
      if (status) query.status = status;
      const applications = await ApplicationForm.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('user', 'name idNumber _id')
        .populate('approvalsSummary.endorsedBy', 'name _id')
        .populate('approvalsSummary.approvedBy', 'name _id');
      const totalDocs = await ApplicationForm.countDocuments(query);
      res.json({
        message: 'Applications retrieved successfully',
        applications,
        pagination: {
          totalDocs,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(totalDocs / parseInt(limit)),
          hasNextPage: skip + applications.length < totalDocs,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error in getAllApplicationForms:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Get all applications for OAS staff dashboard
  async getAllApplicationsForStaff(req, res) {
    try {
      console.log('🔍 Fetching applications for OAS dashboard...');
      
      const applications = await ApplicationForm.find({})
        .populate('user', 'name email idNumber')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`📊 Found ${applications.length} applications`);

      const formattedApplications = applications.map(app => ({
        _id: app._id,
        firstName: app.firstName || '',
        lastName: app.lastName || '',
        middleName: app.middleName || '',
        suffix: app.suffix || '',
        emailAddress: app.emailAddress || '',
        programOfStudyAndYear: app.programOfStudyAndYear || 'N/A',
        existingScholarship: app.existingScholarship || 'None',
        remainingUnitsIncludingThisTerm: app.remainingUnitsIncludingThisTerm || 'N/A',
        remainingTermsToGraduate: app.remainingTermsToGraduate || 'N/A',
        citizenship: app.citizenship || 'N/A',
        civilStatus: app.civilStatus || 'N/A',
        annualFamilyIncome: app.annualFamilyIncome || 'N/A',
        currentResidenceAddress: app.currentResidenceAddress || 'N/A',
        permanentResidentialAddress: app.permanentResidentialAddress || 'N/A',
        contactNumber: app.contactNumber || 'N/A',
        submissionDate: app.createdAt,
        createdAt: app.createdAt,
        status: app.status || 'pending',
        user: app.user
      }));

      res.json(formattedApplications);
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch applications',
        error: error.message 
      });
    }
  },

  // PATCH: Update application by ID (admin, excluding status and approvalsSummary)
  async updateApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const data = { ...req.body };

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      delete data.status;
      delete data.approvalsSummary;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const currentApplication = await ApplicationForm.findById(id);
      if (!currentApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const historyData = currentApplication.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).select('-status -approvalsSummary');

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error in updateApplicationFormById:', error);
      res.status(400).json({ message: `Failed to update application: ${error.message}` });
    }
  },

  // PATCH: Update application by user ID (admin, excluding status and approvalsSummary)
  async updateApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const data = { ...req.body };

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      delete data.status;
      delete data.approvalsSummary;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const currentApplication = await ApplicationForm.findOne({ user: userId });
      if (!currentApplication) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      const historyData = currentApplication.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      const updatedApplication = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: data },
        { new: true, runValidators: true }
      ).select('-status -approvalsSummary');

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error in updateApplicationFormByUserId:', error);
      res.status(400).json({ message: `Failed to update application: ${error.message}` });
    }
  },

  // PATCH: Update the authenticated user's application (excluding status and approvalsSummary)
  async updateMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const data = { ...req.body };

      delete data.status;
      delete data.approvalsSummary;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const currentApplication = await ApplicationForm.findOne({ user: userId });
      if (!currentApplication) {
        return res.status(404).json({ message: 'No application found for this user' });
      } 

      const historyData = currentApplication.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      const updatedApplication = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: data },
        { new: true, runValidators: true }
      ).select('-status -approvalsSummary');

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error in updateMyApplicationForm:', error);
      res.status(400).json({ message: `Failed to update application: ${error.message}` });
    }
  },

  // DELETE: Delete application by ID (admin)
  async deleteApplicationFormById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      const application = await ApplicationForm.findById(id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const historyData = application.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      await ApplicationForm.findByIdAndDelete(id);

      res.json({ message: 'Application deleted successfully' });
    } catch (error) {
      console.error('Error in deleteApplicationFormById:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete application by user ID (admin)
  async deleteApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      const historyData = application.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      await ApplicationForm.findOneAndDelete({ user: userId });

      res.json({ message: 'Application deleted successfully' });
    } catch (error) {
      console.error('Error in deleteApplicationFormByUserId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete only application form (keep documents)
  async deleteApplicationFormOnly(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🗑️ Delete APPLICATION FORM ONLY for:', applicationId);

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({ success: false, message: 'Invalid application ID format' });
      }

      const application = await ApplicationForm.findById(applicationId).populate('user', 'name email');
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      console.log('✅ Deleting APPLICATION FORM ONLY for:', application.firstName, application.lastName);

      // ✅ ONLY delete the application form - KEEP DOCUMENTS
      await ApplicationForm.findByIdAndDelete(applicationId);

      console.log('✅ Application form deleted - Documents preserved');

      res.json({
        success: true,
        message: `Application form for ${application.firstName} ${application.lastName} has been deleted. Documents are preserved for reuse.`,
        deletedData: {
          applicationId: application._id,
          studentName: `${application.firstName} ${application.lastName}`,
          documentsPreserved: true
        }
      });

    } catch (error) {
      console.error('❌ Error deleting application form:', error);
      res.status(500).json({ success: false, message: 'Failed to delete application form', error: error.message });
    }
  },

  // DELETE: Delete only documents (keep application form)
  async deleteDocumentsOnly(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🗑️ Delete DOCUMENTS ONLY for:', applicationId);

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({ success: false, message: 'Invalid application ID format' });
      }

      const application = await ApplicationForm.findById(applicationId).populate('user', 'name email');
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      // ✅ ONLY delete the documents - KEEP APPLICATION FORM
      try {
        const DocumentUpload = require('../models/DocumentUpload');
        const docResult = await DocumentUpload.deleteOne({ user: application.user._id });
        console.log('🗑️ Documents deleted:', docResult.deletedCount, 'records');
        
        if (docResult.deletedCount === 0) {
          return res.status(404).json({ success: false, message: 'No documents found to delete' });
        }
      } catch (docError) {
        return res.status(500).json({ success: false, message: 'Failed to delete documents', error: docError.message });
      }

      console.log('✅ Documents deleted - Application form preserved');

      res.json({
        success: true,
        message: `Documents for ${application.firstName} ${application.lastName} have been deleted. Application form is preserved.`
      });

    } catch (error) {
      console.error('❌ Error deleting documents:', error);
      res.status(500).json({ success: false, message: 'Failed to delete documents', error: error.message });
    }
  },

  // PUT: Set approvalsSummary for the authenticated user's application
  async setApprovalSummary(req, res) {
    try {
      const userId = req.user.id;
      const { endorsedBy, approvedBy } = req.body;

      if (!endorsedBy && !approvedBy) {
        return res.status(400).json({ message: 'At least one of endorsedBy or approvedBy must be provided' });
      }

      const approvalsSummary = {};
      if (endorsedBy) {
        if (!mongoose.Types.ObjectId.isValid(endorsedBy)) {
          return res.status(400).json({ message: 'Invalid endorsedBy ID' });
        }
        approvalsSummary.endorsedBy = endorsedBy;
      }
      if (approvedBy) {
        if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
          return res.status(400).json({ message: 'Invalid approvedBy ID' });
        }
        approvalsSummary.approvedBy = approvedBy;
      }

      const currentApplication = await ApplicationForm.findOne({ user: userId });
      if (!currentApplication) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      const historyData = currentApplication.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      const updatedApplication = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: { approvalsSummary } },
        { new: true, runValidators: true }
      ).select('approvalsSummary')
        .populate('approvalsSummary.endorsedBy', 'name _id')
        .populate('approvalsSummary.approvedBy', 'name _id');

      res.json({
        message: 'Approvals summary updated successfully',
        approvalsSummary: updatedApplication.approvalsSummary
      });
    } catch (error) {
      console.error('Error in setApprovalSummary:', error);
      res.status(400).json({ message: `Failed to update approvals summary: ${error.message}` });
    }
  },

  // PUT: Set status for the authenticated user's application
  async setStatus(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      if (!['Pending', 'Approved', 'Document Verification', 'Interview Scheduled', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const currentApplication = await ApplicationForm.findOne({ user: userId });
      if (!currentApplication) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      const historyData = currentApplication.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      const updatedApplication = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: { status } },
        { new: true, runValidators: true }
      ).select('status');

      // 🎯 CREATE STATUS CHANGE NOTIFICATION
      await NotificationService.createStatusChangeNotification(
        currentApplication.user,
        currentApplication._id,
        status
      );

      res.json({
        message: 'Status updated successfully',
        status: updatedApplication.status
      });
    } catch (error) {
      console.error('Error in setStatus:', error);
      res.status(400).json({ message: `Failed to update status: ${error.message}` });
    }
  },

  // GET: Retrieve application history by user ID (admin)
  async getApplicationHistoryByUserId(req, res) {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const history = await ApplicationHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('user', 'name idNumber _id');

      res.json({
        message: 'Application history retrieved successfully',
        history
      });
    } catch (error) {
      console.error('Error in getApplicationHistoryByUserId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve application history by history ID (admin)
  async getApplicationHistoryById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid history ID' });
      }

      const historyEntry = await ApplicationHistory.findById(id)
        .populate('user', 'name idNumber _id');

      if (!historyEntry) {
        return res.status(404).json({ message: 'History entry not found' });
      }

      res.json({
        message: 'History entry retrieved successfully',
        historyEntry
      });
    } catch (error) {
      console.error('Error in getApplicationHistoryById:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve the authenticated user's application history
  async getMyApplicationHistory(req, res) {
    try {
      const userId = req.user.id;

      const history = await ApplicationHistory.find({ user: userId })
        .sort({ createdAt: -1 });

      res.json({
        message: 'Your application history retrieved successfully',
        history
      });
    } catch (error) {
      console.error('Error in getMyApplicationHistory:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Export application form as PDF by user ID
  async exportApplicationFormAsPDFByUserId(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 PDF request - Received ID:', id);
      console.log('🔍 PDF request - ID type:', typeof id);
      console.log('🔍 PDF request - ID length:', id?.length);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('❌ Invalid ObjectId format:', id);
        return res.status(400).json({ message: 'Invalid user ID format' });
      }

      // Check if user exists
      const User = require('../models/User');
      const user = await User.findById(id);
      if (!user) {
        console.log('❌ User not found in database:', id);
        return res.status(404).json({ message: 'User not found in database' });
      }
      
      console.log('✅ User found:', user.name, user.email);

      const application = await ApplicationForm.findOne({ user: id })
        .populate('user', 'name email')
        .lean();
        
      if (!application) {
        console.log('❌ No application found for user:', id);
        return res.status(404).json({ message: 'No application found for this user' });
      }

      console.log('✅ Application found, generating PDF...');
      
      const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
      const pdfBuffer = await generateApplicationPDF(application, templatePath);

      console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=application-form-${application._id}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // GET: Export authenticated user's application form as PDF
  async exportMyApplicationFormAsPDF(req, res) {
    try {
      const userId = req.user.id;

      const application = await ApplicationForm.findOne({ user: userId })
        .populate('user', 'name email')
        .lean();
      if (!application) {
        return res.status(404).json({ message: 'Application not found for this user' });
      }

      const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
      const pdfBuffer = await generateApplicationPDF(application, templatePath);

      // 🔥 ADD: Log PDF export
      await ActivityLogger.logPDFExport(userId, application._id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=application-form-${application._id}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error in exportMyApplicationFormAsPDF:', error.message, error.stack);
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // Export PDF using application ID (finds user automatically)
  async exportApplicationFormAsPDFByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🔍 PDF request - Application ID:', applicationId);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        console.log('❌ Invalid ObjectId format:', applicationId);
        return res.status(400).json({ message: 'Invalid application ID format' });
      }

      // Find application and populate user
      const application = await ApplicationForm.findById(applicationId)
        .populate('user', 'name email _id')
        .lean();
        
      if (!application) {
        console.log('❌ Application not found:', applicationId);
        return res.status(404).json({ message: 'Application not found' });
      }

      if (!application.user) {
        console.log('❌ No user associated with application:', applicationId);
        return res.status(404).json({ message: 'No user associated with this application' });
      }

      console.log('✅ Application found with user:', application.user.name);
      console.log('✅ User ID:', application.user._id);

      // Generate PDF using existing template
      const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
      const pdfBuffer = await generateApplicationPDF(application, templatePath);

      console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=application-${application.firstName}-${application.lastName}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // ADD: New method to get user activity history
  async getMyActivityHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;

      const history = await ActivityLogger.getUserActivityHistory(userId, parseInt(limit));

      res.json({
        success: true,
        message: 'Activity history retrieved successfully',
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Error in getMyActivityHistory:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve activity history' 
      });
    }
  },

  // Optional: Add method to get activity history for any user (admin only)
  async getUserActivityHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      const history = await ActivityLogger.getUserActivityHistory(userId, parseInt(limit));

      res.json({
        success: true,
        message: 'User activity history retrieved successfully',
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Error in getUserActivityHistory:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve user activity history' 
      });
    }
  },

  // Update application status
  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const application = await ApplicationForm.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      ).populate('user', 'name email');

      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      // Create notification using your existing system
      try {
        const NotificationService = require('../services/NotificationService');
        await NotificationService.createStatusChangeNotification(
          application.user._id,
          application._id,
          status
        );
      } catch (notifError) {
        console.log('⚠️ Notification creation failed:', notifError.message);
      }

      res.json({ success: true, application });
    } catch (error) {
      console.error('❌ Error updating status:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get application details
  async getApplicationDetails(req, res) {
    try {
      const application = await ApplicationForm.findById(req.params.id)
        .populate('user', 'name email idNumber')
        .lean();

      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      res.json({ success: true, application });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get document status
  async getApplicationDocuments(req, res) {
    try {
      const application = await ApplicationForm.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const DocumentUpload = require('../models/DocumentUpload');
      const documents = await DocumentUpload.findOne({ user: application.user });

      const documentStatus = {
        studentPicture: !!(documents?.studentPicture),
        nbiClearance: !!(documents?.nbiClearance),
        gradeReport: !!(documents?.gradeReport),
        incomeTaxReturn: !!(documents?.incomeTaxReturn),
        goodMoralCertificate: !!(documents?.goodMoralCertificate),
        physicalCheckup: !!(documents?.physicalCheckup),
        homeLocationSketch: !!(documents?.homeLocationSketch)
      };

      res.json({ success: true, documents: documentStatus });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get documents by application ID for OAS staff
  async getApplicationDocumentsByAppId(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🔍 Getting documents for application:', applicationId);

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid application ID format' 
        });
      }

      const application = await ApplicationForm.findById(applicationId);
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      const DocumentUpload = require('../models/DocumentUpload');
      const documents = await DocumentUpload.findOne({ user: application.user });

      console.log('📄 Raw documents:', documents);

      const documentStatus = {
        studentPicture: {
          uploaded: !!(documents?.studentPicture),
          filename: documents?.studentPicture && typeof documents.studentPicture === 'string' 
            ? documents.studentPicture 
            : documents?.studentPicture?.originalName || null,
          uploadedAt: documents?.createdAt
        },
        nbiClearance: {
          uploaded: !!(documents?.nbiClearance),
          filename: documents?.nbiClearance && typeof documents.nbiClearance === 'string'
            ? documents.nbiClearance 
            : documents?.nbiClearance?.originalName || null,
          uploadedAt: documents?.createdAt
        },
        gradeReport: {
          uploaded: !!(documents?.gradeReport),
          filename: documents?.gradeReport && typeof documents.gradeReport === 'string'
            ? documents.gradeReport 
            : documents?.gradeReport?.originalName || null,
          uploadedAt: documents?.createdAt
        },
        incomeTaxReturn: {
          uploaded: !!(documents?.incomeTaxReturn),
          filename: documents?.incomeTaxReturn && typeof documents.incomeTaxReturn === 'string'
            ? documents.incomeTaxReturn 
            : documents?.incomeTaxReturn?.originalName || null,
          uploadedAt: documents?.createdAt
        },
        goodMoralCertificate: {
          uploaded: !!(documents?.goodMoralCertificate),
          filename: documents?.goodMoralCertificate && typeof documents.goodMoralCertificate === 'string'
            ? documents.goodMoralCertificate 
            : documents?.goodMoralCertificate?.originalName || null,
          uploadedAt: documents?.createdAt
        },
        physicalCheckup: {
          uploaded: !!(documents?.physicalCheckup),
          filename: documents?.physicalCheckup && typeof documents.physicalCheckup === 'string'
            ? documents.physicalCheckup 
            : documents?.physicalCheckup?.originalName || null,
          uploadedAt: documents?.createdAt
        },
        homeLocationSketch: {
          uploaded: !!(documents?.homeLocationSketch),
          filename: documents?.homeLocationSketch && typeof documents.homeLocationSketch === 'string'
            ? documents.homeLocationSketch 
            : documents?.homeLocationSketch?.originalName || null,
          uploadedAt: documents?.createdAt
        }
      };

      const totalRequired = 7;
      const totalUploaded = Object.values(documentStatus).filter(doc => doc.uploaded).length;

      console.log('📊 Processed document status:', documentStatus);

      res.json({
        success: true,
        documents: documentStatus,
        summary: {
          totalRequired,
          totalUploaded,
          completionRate: Math.round((totalUploaded / totalRequired) * 100),
          isComplete: totalUploaded === totalRequired
        }
      });

    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch documents',
        error: error.message 
      });
    }
  },

  // Delete application by ID (OAS staff only)
  async deleteApplicationById(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🗑️ Delete request for application:', applicationId);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid application ID format' 
        });
      }

      // Find application first to get user info for cleanup
      const application = await ApplicationForm.findById(applicationId)
        .populate('user', 'name email');
        
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      console.log('✅ Found application to delete:', application.firstName, application.lastName);

      // Optional: Delete associated documents as well
      try {
        const DocumentUpload = require('../models/DocumentUpload');
        await DocumentUpload.deleteOne({ user: application.user });
        console.log('🗑️ Associated documents deleted');
      } catch (docError) {
        console.log('⚠️ Could not delete documents:', docError.message);
      }

      // Optional: Create notification for user about deletion
      try {
        const NotificationService = require('../services/NotificationService');
        await NotificationService.createApplicationDeletionNotification(
          application.user._id,
          application._id,
          `Your application has been removed by OAS staff. You can submit a new application if needed.`
        );
        console.log('✅ Deletion notification created');
      } catch (notifError) {
        console.log('⚠️ Could not create notification:', notifError.message);
      }

      // Delete the application
      await ApplicationForm.findByIdAndDelete(applicationId);

      console.log('✅ Application deleted successfully');

      res.json({
        success: true,
        message: `Application for ${application.firstName} ${application.lastName} has been deleted successfully`,
        deletedApplication: {
          id: application._id,
          name: `${application.firstName} ${application.lastName}`,
          email: application.emailAddress
        }
      });

    } catch (error) {
      console.error('❌ Error deleting application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete application',
        error: error.message
      });
    }
  },

  // In your ApplicationController.js - make sure this method exists
  async verifyApplicationForm(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('✅ Backend: Verify application form request:', applicationId);

      // Find the application and populate user info
      const application = await ApplicationForm.findById(applicationId).populate('user');
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      console.log('📋 Found application for user:', application.user?.idNumber);

      // Update the application status
      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        applicationId,
        { 
          status: 'form_verified',
          verifiedAt: new Date(),
          verifiedBy: req.user.id
        },
        { new: true }
      );

      console.log('✅ Application form verified, new status:', updatedApplication.status);

      // Create notification for student (if you have NotificationService)
      try {
        await NotificationService.createApplicationFormVerifiedNotification(
          application.user._id,
          applicationId
        );
        console.log('📱 Notification sent to student');
      } catch (notificationError) {
        console.warn('⚠️ Failed to send notification:', notificationError.message);
        // Don't fail the whole request if notification fails
      }

      res.json({
        success: true,
        message: 'Application form verified successfully',
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          verifiedAt: updatedApplication.verifiedAt
        }
      });

    } catch (error) {
      console.error('❌ Backend: Error verifying application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify application form',
        error: error.message
      });
    }
  },

  // ADD: New method to verify application documents
  async verifyApplicationDocuments(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('✅ Backend: Verify documents request for:', applicationId);

      // Find the application and populate user info
      const application = await ApplicationForm.findById(applicationId).populate('user');
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      console.log('📋 Found application for user:', application.user?.idNumber);

      // Update the application status
      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        applicationId,
        { 
          status: 'document_verification',
          documentsVerifiedAt: new Date(),
          documentsVerifiedBy: req.user.id
        },
        { new: true }
      );

      console.log('✅ Documents verified, new status:', updatedApplication.status);

      // Create notification for student (if you have NotificationService)
      try {
        await NotificationService.createAllDocumentsVerifiedNotification(
          application.user._id,
          applicationId
        );
        await NotificationService.createPersonalityTestAvailableNotification(
          application.user._id,
          applicationId
        );
        console.log('📱 Notification sent to student');
      } catch (notificationError) {
        console.warn('⚠️ Failed to send notification:', notificationError.message);
        // Don't fail the whole request if notification fails
      }

      res.json({
        success: true,
        message: 'Documents verified successfully',
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          documentsVerifiedAt: updatedApplication.documentsVerifiedAt
        }
      });

    } catch (error) {
      console.error('❌ Backend: Error verifying documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify documents',
        error: error.message
      });
    }
  },

  // Add notification when application form is submitted
  async submitApplication(req, res) {
    try {
      // ... your existing submission logic ...
      
      // Add notification after successful submission
      await NotificationService.createApplicationFormSubmittedNotification(
        req.user.id, 
        newApplication._id
      );

      res.json({
        success: true,
        message: 'Application submitted successfully',
        application: newApplication
      });

    } catch (error) {
      // ... error handling ...
    }
  },

  // Add notification when application form is verified
  async verifyApplicationForm(req, res) {
    try {
      const { applicationId } = req.params;
      
      const application = await ApplicationForm.findById(applicationId).populate('user');
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        applicationId,
        { 
          status: 'form_verified',
          verifiedAt: new Date(),
          verifiedBy: req.user.id
        },
        { new: true }
      );

      // Add notification for student
      await NotificationService.createApplicationFormVerifiedNotification(
        application.user._id,
        applicationId
      );

      res.json({
        success: true,
        message: 'Application form verified successfully.',
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          verifiedAt: updatedApplication.verifiedAt
        }
      });

    } catch (error) {
      console.error('❌ Error verifying application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify application form',
        error: error.message
      });
    }
  },

  // Add notification when documents are uploaded
  async uploadDocuments(req, res) {
    try {
      // ... your existing upload logic ...
      
      // Add notification after successful upload
      await NotificationService.createDocumentsSubmittedNotification(
        req.user.id,
        applicationId,
        uploadedFiles.length
      );

      res.json({
        success: true,
        message: 'Documents uploaded successfully'
      });

    } catch (error) {
      // ... error handling ...
    }
  },

  // Add notification when all documents are verified
  async verifyApplicationDocuments(req, res) {
    try {
      const { applicationId } = req.params;

      const application = await ApplicationForm.findById(applicationId).populate('user');
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        applicationId,
        { 
          status: 'document_verification',
          documentsVerifiedAt: new Date(),
          documentsVerifiedBy: req.user.id
        },
        { new: true }
      );

      // Add notification for student
      await NotificationService.createAllDocumentsVerifiedNotification(
        application.user._id,
        applicationId
      );

      // Also notify that personality test is now available
      await NotificationService.createPersonalityTestAvailableNotification(
        application.user._id,
        applicationId
      );

      res.json({
        success: true,
        message: 'Documents verified successfully.',
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          documentsVerifiedAt: updatedApplication.documentsVerifiedAt
        }
      });

    } catch (error) {
      console.error('❌ Error verifying documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify documents',
        error: error.message
      });
    }
  },

  // Add this temporary route to test database connection:
  async testDatabaseConnection(req, res) {
    try {
      const count = await ApplicationForm.countDocuments();
      res.json({ 
        message: 'Database connection OK', 
        applicationCount: count,
        dbState: mongoose.connection.readyState 
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Database error', 
        error: error.message 
      });
    }
  },

  async verifyApplicationForm(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('✅ Backend: Verify application form request:', applicationId);

      // Find the application and populate user info
      const application = await ApplicationForm.findById(applicationId).populate('user');
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      console.log('📋 Found application for user:', application.user?.idNumber);

      // Update the application status
      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        applicationId,
        { 
          status: 'form_verified',
          verifiedAt: new Date(),
          verifiedBy: req.user.id
        },
        { new: true }
      );

      console.log('✅ Application form verified, new status:', updatedApplication.status);

      // Create notification for student (if you have NotificationService)
      try {
        await NotificationService.createApplicationFormVerifiedNotification(
          application.user._id,
          applicationId
        );
        console.log('📱 Notification sent to student');
      } catch (notificationError) {
        console.warn('⚠️ Failed to send notification:', notificationError.message);
        // Don't fail the whole request if notification fails
      }

      res.json({
        success: true,
        message: 'Application form verified successfully',
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          verifiedAt: updatedApplication.verifiedAt
        }
      });

    } catch (error) {
      console.error('❌ Backend: Error verifying application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify application form',
        error: error.message
      });
    }
  },

  // ADD: New method to get dashboard stats
  async getDashboardStats(req, res) {
    try {
      console.log('✅ Backend: Getting dashboard stats...');

      // Count applications by status
      const stats = await ApplicationForm.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('📊 Raw stats from database:', stats);

      // Initialize counts
      let newApplications = 0;        // pending
      let documentVerifications = 0;  // form_verified (waiting for doc verification)
      let scheduledInterviews = 0;    // document_verification (ready for interview)
      let activeScholars = 0;         // approved

      // Map the aggregated results
      stats.forEach(stat => {
        switch (stat._id) {
          case 'pending':
            newApplications = stat.count;
            break;
          case 'form_verified':
            documentVerifications = stat.count;
            break;
          case 'document_verification':
            scheduledInterviews = stat.count;
            break;
          case 'approved':
            activeScholars = stat.count;
            break;
          default:
            console.log('📋 Unknown status:', stat._id, 'count:', stat.count);
        }
      });

      const dashboardStats = {
        newApplications,        // Status: "pending"
        documentVerifications,  // Status: "form_verified" 
        scheduledInterviews,    // Status: "document_verification"
        activeScholars         // Status: "approved"
      };

      console.log('✅ Dashboard stats calculated:', dashboardStats);

      res.json({
        success: true,
        stats: dashboardStats
      });

    } catch (error) {
      console.error('❌ Backend: Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard stats',
        error: error.message
      });
    }
  },

  // PUT: Set status for a specific application by ID (for OAS staff)
  async setStatusById(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid application ID format' });
      }

      // Find the application first
      const currentApplication = await ApplicationForm.findById(id);
      if (!currentApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Create history entry before updating
      const historyData = currentApplication.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      // Update the application status
      const updatedApplication = await ApplicationForm.findByIdAndUpdate(
        id,
        { 
          $set: { 
            status,
            updatedAt: new Date(),
            updatedBy: req.user.id
          }
        },
        { new: true, runValidators: true }
      ).populate('user', 'name email');

      // Create status change notification
      try {
        const NotificationService = require('../services/NotificationService');
        await NotificationService.createStatusChangeNotification(
          currentApplication.user,
          currentApplication._id,
          status
        );
      } catch (notifError) {
        console.warn('⚠️ Failed to create notification:', notifError.message);
      }

      res.json({
        message: 'Status updated successfully',
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          updatedAt: updatedApplication.updatedAt,
          user: updatedApplication.user
        }
      });
    } catch (error) {
      console.error('Error in setStatusById:', error);
      res.status(400).json({ message: `Failed to update status: ${error.message}` });
    }
  },

  // PATCH /application/auto-complete - Auto-complete application when personality test is detected
  async autoCompleteApplication(req, res) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Check if application is already approved or rejected
      if (['approved', 'rejected'].includes(application.status)) {
        return res.json({ 
          message: 'Application already completed', 
          status: application.status 
        });
      }

      // Verify that personality test actually exists
      const PersonalityTest = require('../models/PersonalityTest');
      const existingTest = await PersonalityTest.findOne({
        applicationId: application._id,
      });

      if (!existingTest) {
        return res.status(400).json({ 
          message: 'Cannot auto-complete: No personality test found' 
        });
      }

      // Create history entry before updating
      const ApplicationHistory = require('../models/ApplicationHistory');
      const historyData = application.toObject();
      delete historyData._id;
      const historyEntry = new ApplicationHistory(historyData);
      await historyEntry.save();

      // Update application status to approved
      application.status = 'approved';
      application.updatedAt = new Date();
      application.personalityTestCompletedAt = new Date();
      await application.save();

      // Create notification
      const NotificationService = require('../services/NotificationService');
      await NotificationService.createNotification({
        userId: userId,
        type: 'application_status_update',
        title: 'Application Approved',
        message: `Your application has been automatically approved upon completion of the personality test.`,
        data: {
          applicationId: application._id,
          newStatus: 'approved',
          reason: reason || 'personality_test_completed'
        }
      });

      console.log(`✅ Application ${application._id} auto-completed for user ${userId}`);

      res.json({
        message: 'Application auto-completed successfully',
        status: 'approved',
        applicationId: application._id
      });

    } catch (error) {
      console.error('Error in autoCompleteApplication:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  }
};

module.exports = ApplicationController;