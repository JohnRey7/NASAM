const ApplicationForm = require('../models/ApplicationForm');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');


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
    // Read HTML template
    let template;
    try {
      template = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load PDF template: ${error.message}`);
    }

    // Prepare data for template
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

    // Replace placeholders in template
    let html = template;

    // Escape HTML special characters
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

    // Replace scalar fields
    const replaceScalar = (key, value) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), escapeHtml(value));
      html = html.replace(new RegExp(`{{{${key}}}}`, 'g'), String(value ?? 'N/A'));
    };

    // Top-level fields
    for (const key in data) {
      if (typeof data[key] === 'string' || typeof data[key] === 'number') {
        replaceScalar(key, data[key]);
      }
    }

    // Family fields
    for (const parent of ['father', 'mother']) {
      for (const field in data.family[parent]) {
        replaceScalar(`family.${parent}.${field}`, data.family[parent][field]);
      }
    }

    // Education fields
    for (const level of ['elementary', 'secondary']) {
      for (const field in data.education[level]) {
        replaceScalar(`education.${level}.${field}`, data.education[level][field]);
      }
    }

    // Handle arrays
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

    // Handle conditional blocks
    html = html.replace(/{{#if ([^}]+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, (match, condition, ifContent, elseContent) => {
      const path = condition.split('.');
      const value = path.reduce((obj, k) => obj?.[k], data);
      return value && (Array.isArray(value) ? value.length : value) ? ifContent : elseContent;
    });

    // Generate PDF with Puppeteer
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

      // Exclude status and approvalsSummary
      delete data.status;
      delete data.approvalsSummary;

      // Check for existing application
      const existingApplication = await ApplicationForm.findOne({ user: userId });
      if (existingApplication) {
        return res.status(400).json({ message: 'User already has an application' });
      }

      // Create application
      const application = new ApplicationForm({
        user: userId,
        ...data
      });

      await application.save();

      // Exclude status and approvalsSummary from response
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

  // GET: Read the authenticated user's application (excluding status and approvalsSummary)
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

  // PATCH: Update application by ID (admin, excluding status and approvalsSummary)
  async updateApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const data = { ...req.body };

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      // Exclude status and approvalsSummary
      delete data.status;
      delete data.approvalsSummary;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const application = await ApplicationForm.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).select('-status -approvalsSummary');

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({
        message: 'Application updated successfully',
        application
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

      // Exclude status and approvalsSummary
      delete data.status;
      delete data.approvalsSummary;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const application = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: data },
        { new: true, runValidators: true }
      ).select('-status -approvalsSummary');

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({
        message: 'Application updated successfully',
        application
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

      // Exclude status and approvalsSummary
      delete data.status;
      delete data.approvalsSummary;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const application = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: data },
        { new: true, runValidators: true }
      ).select('-status -approvalsSummary');

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({
        message: 'Application updated successfully',
        application
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

      const application = await ApplicationForm.findByIdAndDelete(id);

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

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

      const application = await ApplicationForm.findOneAndDelete({ user: userId });

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({ message: 'Application deleted successfully' });
    } catch (error) {
      console.error('Error in deleteApplicationFormByUserId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // PUT: Set approvalsSummary for the authenticated user's application
  async setApprovalSummary(req, res) {
    try {
      const userId = req.user.id;
      const { endorsedBy, approvedBy } = req.body;

      // Validate input
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

      const application = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: { approvalsSummary } },
        { new: true, runValidators: true }
      ).select('approvalsSummary')
        .populate('approvalsSummary.endorsedBy', 'name _id')
        .populate('approvalsSummary.approvedBy', 'name _id');

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({
        message: 'Approvals summary updated successfully',
        approvalsSummary: application.approvalsSummary
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

      // Validate input
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      if (!['Pending', 'Approved', 'Document Verification', 'Interview Scheduled', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const application = await ApplicationForm.findOneAndUpdate(
        { user: userId },
        { $set: { status } },
        { new: true, runValidators: true }
      ).select('status');

      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }

      res.json({
        message: 'Status updated successfully',
        status: application.status
      });
    } catch (error) {
      console.error('Error in setStatus:', error);
      res.status(400).json({ message: `Failed to update status: ${error.message}` });
    }
  },

  // GET: Export application form as PDF by user ID
  async exportApplicationFormAsPDFByUserId(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Fetch application
      const application = await ApplicationForm.findOne({ user: id })
        .populate('user', 'name email')
        .lean();

      if (!application) {
        return res.status(404).json({ message: 'Application not found for this user' });
      }

      // Generate PDF
      const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
      const pdfBuffer = await generateApplicationPDF(application, templatePath);

      // Send PDF as download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=application-form-${application._id}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error in exportApplicationFormAsPDFByUserId:', error.message, error.stack);
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // GET: Export authenticated user's application form as PDF
  async exportMyApplicationFormAsPDF(req, res) {
    try {
      const userId = req.user.id;

      // Fetch application
      const application = await ApplicationForm.findOne({ user: userId })
        .populate('user', 'name email')
        .lean();
      console.log(application._id)
      if (!application) {
        return res.status(404).json({ message: 'Application not found for this user' });
      }

      // Generate PDF
      const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
      const pdfBuffer = await generateApplicationPDF(application, templatePath);

      // Send PDF as download
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
  }

};

module.exports = ApplicationController;