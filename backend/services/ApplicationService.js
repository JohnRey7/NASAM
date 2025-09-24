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

  // Helper function to generate PDF from ApplicationForm
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
            occupation: application.familyBackground?.father?.occupation || '',
            monthlyIncome: application.familyBackground?.father?.monthlyIncome || 0,
            educationalAttainment: application.familyBackground?.father?.educationalAttainment || '',
          },
          mother: {
            firstName: application.familyBackground?.mother?.firstName || '',
            middleName: application.familyBackground?.mother?.middleName || 'N/A',
            lastName: application.familyBackground?.mother?.lastName || '',
            suffix: application.familyBackground?.mother?.suffix || 'N/A',
            occupation: application.familyBackground?.mother?.occupation || '',
            monthlyIncome: application.familyBackground?.mother?.monthlyIncome || 0,
            educationalAttainment: application.familyBackground?.mother?.educationalAttainment || '',
          }
        },
        siblings: application.familyBackground?.siblings?.map(sibling => ({
          firstName: sibling.firstName || '',
          middleName: sibling.middleName || 'N/A',
          lastName: sibling.lastName || '',
          suffix: sibling.suffix || 'N/A',
          occupation: sibling.occupation || '',
          monthlyIncome: sibling.monthlyIncome || 0,
          educationalAttainment: sibling.educationalAttainment || '',
          age: sibling.age || 0,
          relationship: sibling.relationship || ''
        })) || [],
        formatYearLevel: this.formatYearLevel(application.yearLevel)
      };

      // Replace placeholders in template
      let html = template;
      const replaceValue = (key, value) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value || '');
      };

      // Replace all data placeholders
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object' && data[key] !== null) {
          if (Array.isArray(data[key])) {
            // Handle arrays (like siblings)
            replaceValue(key, JSON.stringify(data[key]));
          } else {
            // Handle nested objects
            Object.keys(data[key]).forEach(nestedKey => {
              if (typeof data[key][nestedKey] === 'object' && data[key][nestedKey] !== null) {
                Object.keys(data[key][nestedKey]).forEach(deepKey => {
                  replaceValue(`${key}.${nestedKey}.${deepKey}`, data[key][nestedKey][deepKey]);
                });
              } else {
                replaceValue(`${key}.${nestedKey}`, data[key][nestedKey]);
              }
            });
          }
        } else {
          replaceValue(key, data[key]);
        }
      });

      // Launch browser and generate PDF
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      return pdfBuffer;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Create application form
  static async createApplicationForm(userId, data) {
    // Remove protected fields
    delete data.status;
    delete data.approvalsSummary;

    const existingApplication = await ApplicationForm.findOne({ user: userId });
    if (existingApplication) {
      throw new Error('User already has an application');
    }

    const application = new ApplicationForm({
      user: userId,
      ...data
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

    return {
      message: 'Application created successfully',
      application: applicationResponse
    };
  }

  // Read application by ID
  static async readApplicationFormById(id) {
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

    return {
      message: 'Application retrieved successfully',
      application
    };
  }

  // Read application by user ID
  static async readApplicationFormByUserId(userId) {
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

    return {
      message: 'Application retrieved successfully',
      application
    };
  }

  // Read current user's application
  static async readMyApplicationForm(userId) {
    const application = await ApplicationForm.findOne({ user: userId });

    if (!application) {
      throw new Error('No application found for this user');
    }

    return {
      message: 'Application retrieved successfully',
      application
    };
  }

  // Get all applications with pagination and filtering
  static async getAllApplicationForms(filters = {}) {
    const { page = 1, limit = 10, firstName, emailAddress, status } = filters;
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
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    return {
      message: 'Applications retrieved successfully',
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDocs,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      }
    };
  }

  // Get applications for staff with enhanced filtering
  static async getAllApplicationsForStaff(filters = {}) {
    const { 
      page = 1, 
      limit = 10, 
      firstName, 
      emailAddress, 
      status, 
      typeOfScholarship,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    
    if (firstName) query.firstName = { $regex: firstName, $options: 'i' };
    if (emailAddress) query.emailAddress = { $regex: emailAddress, $options: 'i' };
    if (status) query.status = status;
    if (typeOfScholarship) query.typeOfScholarship = typeOfScholarship;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const applications = await ApplicationForm.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj)
      .populate('user', 'name idNumber _id')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    const totalDocs = await ApplicationForm.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    // Get statistics
    const statusCounts = await ApplicationForm.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
      message: 'Applications retrieved successfully',
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDocs,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      statistics: {
        statusBreakdown: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    };
  }

  // Update application by ID
  static async updateApplicationFormById(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    // Remove protected fields
    delete updateData.status;
    delete updateData.approvalsSummary;

    const application = await ApplicationForm.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      throw new Error('Application not found');
    }

    return {
      message: 'Application updated successfully',
      application
    };
  }

  // Update application by user ID
  static async updateApplicationFormByUserId(userId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Remove protected fields
    delete updateData.status;
    delete updateData.approvalsSummary;

    const application = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      throw new Error('No application found for this user');
    }

    return {
      message: 'Application updated successfully',
      application
    };
  }

  // Update current user's application
  static async updateMyApplicationForm(userId, updateData) {
    // Remove protected fields
    delete updateData.status;
    delete updateData.approvalsSummary;

    const application = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      throw new Error('No application found for this user');
    }

    return {
      message: 'Application updated successfully',
      application
    };
  }

  // Delete application by ID
  static async deleteApplicationFormById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findByIdAndDelete(id);
    if (!application) {
      throw new Error('Application not found');
    }

    // Also delete related history
    await ApplicationHistory.deleteMany({ applicationId: id });

    return {
      message: 'Application and related history deleted successfully',
      deletedApplication: application
    };
  }

  // Delete application by user ID
  static async deleteApplicationFormByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOneAndDelete({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    // Also delete related history
    await ApplicationHistory.deleteMany({ applicationId: application._id });

    return {
      message: 'Application and related history deleted successfully',
      deletedApplication: application
    };
  }

  // Delete only application form (keep documents)
  static async deleteApplicationFormOnly(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    // Store documents before deletion
    const documents = {
      transcriptOfRecordsFile: application.transcriptOfRecordsFile,
      certificateOfEnrollmentFile: application.certificateOfEnrollmentFile,
      parentsBirthCertificateFile: application.parentsBirthCertificateFile,
      parentsMarriageCertificateFile: application.parentsMarriageCertificateFile,
      applicantBirthCertificateFile: application.applicantBirthCertificateFile,
      applicantMarriageCertificateFile: application.applicantMarriageCertificateFile,
      barangayIndigencyFile: application.barangayIndigencyFile,
      applicantIDFile: application.applicantIDFile
    };

    await ApplicationForm.findOneAndDelete({ user: userId });

    return {
      message: 'Application form deleted successfully, documents preserved',
      preservedDocuments: documents
    };
  }

  // Delete only documents (keep application form)
  static async deleteDocumentsOnly(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const updateData = {
      transcriptOfRecordsFile: null,
      certificateOfEnrollmentFile: null,
      parentsBirthCertificateFile: null,
      parentsMarriageCertificateFile: null,
      applicantBirthCertificateFile: null,
      applicantMarriageCertificateFile: null,
      barangayIndigencyFile: null,
      applicantIDFile: null
    };

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true }
    );

    return {
      message: 'Documents deleted successfully, application form preserved',
      application: updatedApplication
    };
  }

  // Set approval summary
  static async setApprovalSummary(id, approvalData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findById(id);
    if (!application) {
      throw new Error('Application not found');
    }

    application.approvalsSummary = {
      ...application.approvalsSummary,
      ...approvalData
    };

    await application.save();

    return {
      message: 'Approval summary updated successfully',
      approvalsSummary: application.approvalsSummary
    };
  }

  // Set application status
  static async setStatus(id, status, userId, remarks = '') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findById(id)
      .populate('user', 'name idNumber email');
    
    if (!application) {
      throw new Error('Application not found');
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // Create history entry
    await ApplicationHistory.create({
      applicationId: id,
      userId: application.user._id,
      changedBy: userId,
      oldStatus,
      newStatus: status,
      remarks,
      timestamp: new Date()
    });

    // Create notification for status change
    await NotificationService.createStatusChangeNotification(
      application.user._id,
      id,
      oldStatus,
      status,
      remarks
    );

    return {
      message: 'Status updated successfully',
      application: {
        id: application._id,
        status: application.status,
        previousStatus: oldStatus
      }
    };
  }

  // Get application history by user ID
  static async getApplicationHistoryByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const history = await ApplicationHistory.find({ userId })
      .populate('changedBy', 'name _id')
      .sort({ timestamp: -1 });

    return {
      message: 'Application history retrieved successfully',
      history
    };
  }

  // Get application history by application ID
  static async getApplicationHistoryById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid application ID');
    }

    const history = await ApplicationHistory.find({ applicationId: id })
      .populate('changedBy', 'name _id')
      .populate('userId', 'name idNumber')
      .sort({ timestamp: -1 });

    if (!history.length) {
      throw new Error('No history found for this application');
    }

    return {
      message: 'Application history retrieved successfully',
      history
    };
  }

  // Get current user's application history
  static async getMyApplicationHistory(userId) {
    const history = await ApplicationHistory.find({ userId })
      .populate('changedBy', 'name _id')
      .sort({ timestamp: -1 });

    return {
      message: 'Application history retrieved successfully',
      history
    };
  }

  // Export application as PDF by user ID
  static async exportApplicationFormAsPDFByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId })
      .populate('user', 'name idNumber');

    if (!application) {
      throw new Error('No application found for this user');
    }

    const templatePath = path.join(__dirname, '..', 'pdf-templates', 'application-form.html');
    const pdfBuffer = await this.generateApplicationPDF(application, templatePath);

    return {
      filename: `application-${application.user.idNumber}-${application.user.name.replace(/\s+/g, '-')}.pdf`,
      buffer: pdfBuffer,
      contentType: 'application/pdf'
    };
  }

  // Export current user's application as PDF
  static async exportMyApplicationFormAsPDF(userId) {
    const application = await ApplicationForm.findOne({ user: userId })
      .populate('user', 'name idNumber');

    if (!application) {
      throw new Error('No application found for this user');
    }

    const templatePath = path.join(__dirname, '..', 'pdf-templates', 'application-form.html');
    const pdfBuffer = await this.generateApplicationPDF(application, templatePath);

    return {
      filename: `my-application-${application.user.idNumber}.pdf`,
      buffer: pdfBuffer,
      contentType: 'application/pdf'
    };
  }
}

module.exports = ApplicationService;