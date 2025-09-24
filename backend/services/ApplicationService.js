const ApplicationForm = require('../models/ApplicationForm');
const ApplicationHistory = require('../models/ApplicationHistory');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const ActivityLogger = require('./ActivityLogger');
const NotificationService = require('./NotificationService');

class ApplicationService {
  // Helper function to format yearLevel for display
  static formatYearLevel(yearLevel) {
    if (!yearLevel) return 'N/A';
    const year = Math.floor(yearLevel);
    const isSummer = yearLevel % 1 !== 0;
    return isSummer ? `${year}th Year Summer` : `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`;
  }

  // Generate PDF from ApplicationForm
  static async generateApplicationPDF(application, templatePath) {
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
            yearLevel: this.formatYearLevel(item.yearLevel),
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

  // Create a new application
  static async createApplication(userId, data) {
    const sanitizedData = { ...data };
    delete sanitizedData.status;
    delete sanitizedData.approvalsSummary;

    const existingApplication = await ApplicationForm.findOne({ user: userId });
    if (existingApplication) {
      throw new Error('User already has an application');
    }

    const application = new ApplicationForm({
      user: userId,
      ...sanitizedData
    });

    await application.save();

    // Log application submission
    await ActivityLogger.logApplicationSubmission(
      userId, 
      application._id, 
      data.typeOfScholarship || 'scholarship'
    );

    // Create notification
    await NotificationService.createApplicationSubmittedNotification(
      userId,
      application._id
    );

    const applicationResponse = await ApplicationForm.findById(application._id)
      .select('-status -approvalsSummary');

    return applicationResponse;
  }

  // Get application by ID (admin)
  static async getApplicationById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findById(id)
      .populate('user', 'name idNumber _id')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  // Get application by user ID (admin)
  static async getApplicationByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId })
      .populate('user', 'name idNumber _id')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    if (!application) {
      throw new Error('No application found for this user');
    }

    return application;
  }

  // Get user's own application
  static async getUserApplication(userId) {
    const application = await ApplicationForm.findOne({ user: userId });

    if (!application) {
      throw new Error('No application found for this user');
    }

    return application;
  }

  // Get all applications with pagination and filtering
  static async getAllApplications({ page = 1, limit = 10, firstName, emailAddress, status }) {
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

    return {
      applications,
      pagination: {
        totalDocs,
        limit: parseInt(limit),
        page: parseInt(page),
        totalPages: Math.ceil(totalDocs / parseInt(limit)),
        hasNextPage: skip + applications.length < totalDocs,
        hasPrevPage: page > 1
      }
    };
  }

  // Get all applications for OAS staff dashboard
  static async getAllApplicationsForStaff() {
    const applications = await ApplicationForm.find({})
      .populate('user', 'name email idNumber')
      .sort({ createdAt: -1 })
      .lean();

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

    return formattedApplications;
  }

  // Update application by ID (admin)
  static async updateApplicationById(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const sanitizedData = { ...data };
    delete sanitizedData.status;
    delete sanitizedData.approvalsSummary;

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const currentApplication = await ApplicationForm.findById(id);
    if (!currentApplication) {
      throw new Error('Application not found');
    }

    // Create history entry
    await this.createHistoryEntry(currentApplication);

    const updatedApplication = await ApplicationForm.findByIdAndUpdate(
      id,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).select('-status -approvalsSummary');

    return updatedApplication;
  }

  // Update application by user ID (admin)
  static async updateApplicationByUserId(userId, data) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const sanitizedData = { ...data };
    delete sanitizedData.status;
    delete sanitizedData.approvalsSummary;

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const currentApplication = await ApplicationForm.findOne({ user: userId });
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await this.createHistoryEntry(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).select('-status -approvalsSummary');

    return updatedApplication;
  }

  // Update user's own application
  static async updateUserApplication(userId, data) {
    const sanitizedData = { ...data };
    delete sanitizedData.status;
    delete sanitizedData.approvalsSummary;

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const currentApplication = await ApplicationForm.findOne({ user: userId });
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await this.createHistoryEntry(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).select('-status -approvalsSummary');

    return updatedApplication;
  }

  // Delete application by ID (admin)
  static async deleteApplicationById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findById(id);
    if (!application) {
      throw new Error('Application not found');
    }

    // Create history entry
    await this.createHistoryEntry(application);

    await ApplicationForm.findByIdAndDelete(id);

    return { message: 'Application deleted successfully' };
  }

  // Delete application by user ID (admin)
  static async deleteApplicationByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await this.createHistoryEntry(application);

    await ApplicationForm.findOneAndDelete({ user: userId });

    return { message: 'Application deleted successfully' };
  }

  // Set approval summary
  static async setApprovalSummary(userId, { endorsedBy, approvedBy }) {
    if (!endorsedBy && !approvedBy) {
      throw new Error('At least one of endorsedBy or approvedBy must be provided');
    }

    const approvalsSummary = {};
    if (endorsedBy) {
      if (!mongoose.Types.ObjectId.isValid(endorsedBy)) {
        throw new Error('Invalid endorsedBy ID');
      }
      approvalsSummary.endorsedBy = endorsedBy;
    }
    if (approvedBy) {
      if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
        throw new Error('Invalid approvedBy ID');
      }
      approvalsSummary.approvedBy = approvedBy;
    }

    const currentApplication = await ApplicationForm.findOne({ user: userId });
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await this.createHistoryEntry(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      { $set: { approvalsSummary } },
      { new: true, runValidators: true }
    ).select('approvalsSummary')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    return updatedApplication.approvalsSummary;
  }

  // Set application status
  static async setStatus(userId, status) {
    if (!status) {
      throw new Error('Status is required');
    }

    if (!['Pending', 'Approved', 'Document Verification', 'Interview Scheduled', 'Rejected'].includes(status)) {
      throw new Error('Invalid status value');
    }
    
    const currentApplication = await ApplicationForm.findOne({ user: userId });
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await this.createHistoryEntry(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      { $set: { status } },
      { new: true, runValidators: true }
    ).select('status');

    // Create status change notification
    await NotificationService.createStatusChangeNotification(
      currentApplication.user,
      currentApplication._id,
      status
    );

    return updatedApplication.status;
  }

  // Set status by application ID
  static async setStatusById(id, status, updatedBy) {
    if (!status) {
      throw new Error('Status is required');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID format');
    }

    const currentApplication = await ApplicationForm.findById(id);
    if (!currentApplication) {
      throw new Error('Application not found');
    }

    // Create history entry
    await this.createHistoryEntry(currentApplication);

    const updatedApplication = await ApplicationForm.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status,
          updatedAt: new Date(),
          updatedBy: updatedBy
        }
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    // Create status change notification
    try {
      await NotificationService.createStatusChangeNotification(
        currentApplication.user,
        currentApplication._id,
        status
      );
    } catch (notifError) {
      console.warn('⚠️ Failed to create notification:', notifError.message);
    }

    return {
      id: updatedApplication._id,
      status: updatedApplication.status,
      updatedAt: updatedApplication.updatedAt,
      user: updatedApplication.user
    };
  }

  // Export application as PDF by user ID
  static async exportApplicationPDFByUserId(id, templatePath) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid user ID format');
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found in database');
    }

    const application = await ApplicationForm.findOne({ user: id })
      .populate('user', 'name email')
      .lean();
      
    if (!application) {
      throw new Error('No application found for this user');
    }

    const pdfBuffer = await this.generateApplicationPDF(application, templatePath);
    return { pdfBuffer, application };
  }

  // Export user's own application as PDF
  static async exportUserApplicationPDF(userId, templatePath) {
    const application = await ApplicationForm.findOne({ user: userId })
      .populate('user', 'name email')
      .lean();

    if (!application) {
      throw new Error('Application not found for this user');
    }

    const pdfBuffer = await this.generateApplicationPDF(application, templatePath);

    // Log PDF export
    await ActivityLogger.logPDFExport(userId, application._id);

    return { pdfBuffer, application };
  }

  // Export PDF by application ID
  static async exportApplicationPDFByApplicationId(applicationId, templatePath) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findById(applicationId)
      .populate('user', 'name email _id')
      .lean();
      
    if (!application) {
      throw new Error('Application not found');
    }

    if (!application.user) {
      throw new Error('No user associated with this application');
    }

    const pdfBuffer = await this.generateApplicationPDF(application, templatePath);
    return { pdfBuffer, application };
  }

  // Get user activity history
  static async getUserActivityHistory(userId, limit = 50) {
    const history = await ActivityLogger.getUserActivityHistory(userId, parseInt(limit));
    return history;
  }

  // Update application status
  static async updateApplicationStatus(id, status) {
    const application = await ApplicationForm.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');

    if (!application) {
      throw new Error('Application not found');
    }

    // Create notification
    try {
      await NotificationService.createStatusChangeNotification(
        application.user._id,
        application._id,
        status
      );
    } catch (notifError) {
      console.log('⚠️ Notification creation failed:', notifError.message);
    }

    return application;
  }

  // Get application details
  static async getApplicationDetails(id) {
    const application = await ApplicationForm.findById(id)
      .populate('user', 'name email idNumber')
      .lean();

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  // Get application documents
  static async getApplicationDocuments(id) {
    const application = await ApplicationForm.findById(id);
    if (!application) {
      throw new Error('Application not found');
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

    return documentStatus;
  }

  // Get documents by application ID for OAS staff
  static async getApplicationDocumentsByAppId(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const DocumentUpload = require('../models/DocumentUpload');
    const documents = await DocumentUpload.findOne({ user: application.user });

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

    return {
      documents: documentStatus,
      summary: {
        totalRequired,
        totalUploaded,
        completionRate: Math.round((totalUploaded / totalRequired) * 100),
        isComplete: totalUploaded === totalRequired
      }
    };
  }

  // Get dashboard stats
  static async getDashboardStats() {
    const stats = await ApplicationForm.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let newApplications = 0;        // pending
    let documentVerifications = 0;  // form_verified (waiting for doc verification)
    let scheduledInterviews = 0;    // document_verification (ready for interview)
    let activeScholars = 0;         // approved

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
      }
    });

    return {
      newApplications,
      documentVerifications,
      scheduledInterviews,
      activeScholars
    };
  }

  // Auto-complete application when personality test is completed
  static async autoCompleteApplication(userId, reason) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    if (['approved', 'rejected'].includes(application.status)) {
      return { 
        message: 'Application already completed', 
        status: application.status 
      };
    }

    // Verify that personality test actually exists
    const PersonalityTest = require('../models/PersonalityTest');
    const existingTest = await PersonalityTest.findOne({
      applicationId: application._id,
    });

    if (!existingTest) {
      throw new Error('Cannot auto-complete: No personality test found');
    }

    // Create history entry
    await this.createHistoryEntry(application);

    // Update application status to approved
    application.status = 'approved';
    application.updatedAt = new Date();
    application.personalityTestCompletedAt = new Date();
    await application.save();

    // Create notification
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

    return {
      message: 'Application auto-completed successfully',
      status: 'approved',
      applicationId: application._id
    };
  }

  // Helper method to create history entry
  static async createHistoryEntry(application) {
    const historyData = application.toObject();
    delete historyData._id;
    const historyEntry = new ApplicationHistory(historyData);
    await historyEntry.save();
  }

  // Get application history by user ID
  static async getApplicationHistoryByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const history = await ApplicationHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name idNumber _id');

    return history;
  }

  // Get application history by history ID
  static async getApplicationHistoryById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid history ID');
    }

    const historyEntry = await ApplicationHistory.findById(id)
      .populate('user', 'name idNumber _id');

    if (!historyEntry) {
      throw new Error('History entry not found');
    }

    return historyEntry;
  }

  // Get user's application history
  static async getUserApplicationHistory(userId) {
    const history = await ApplicationHistory.find({ user: userId })
      .sort({ createdAt: -1 });

    return history;
  }
}

module.exports = ApplicationService;