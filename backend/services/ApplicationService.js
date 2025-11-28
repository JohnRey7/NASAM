const ApplicationForm = require('../models/ApplicationForm');
const ApplicationHistory = require('../models/ApplicationHistory');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const ActivityLogger = require('./ActivityLogger');
const NotificationService = require('./NotificationService');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class ApplicationService {
  // Helper function to format yearLevel for display
  static formatYearLevel(yearLevel) {
    if (!yearLevel) return 'N/A';
    const year = Math.floor(yearLevel);
    const isSummer = yearLevel % 1 !== 0;
    return isSummer ? `${year}th Year Summer` : `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`;
  }

  // Helper function to create application history
  static async createApplicationHistory(application) {
    const historyData = application.toObject();
    const historyEntry = new ApplicationHistory(historyData);
    await historyEntry.save();
    return historyEntry;
  }

  // Helper function to validate and sanitize text fields (names, addresses, etc.)
  static sanitizeTextField(value, fieldName, options = {}) {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    const stringValue = String(value).trim();
    
    // Check for maximum length
    if (options.maxLength && stringValue.length > options.maxLength) {
      throw new Error(`${fieldName} exceeds maximum length of ${options.maxLength} characters`);
    }

    // For name fields - only letters, spaces, periods, hyphens, apostrophes, and Filipino characters
    if (options.type === 'name') {
      const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s.''-]+$/;
      if (!nameRegex.test(stringValue)) {
        throw new Error(`${fieldName} contains invalid characters. Only letters, spaces, periods, hyphens, and apostrophes are allowed`);
      }
    }

    // For address fields - letters, numbers, spaces, and common punctuation
    if (options.type === 'address') {
      const addressRegex = /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.,#()\-/']+$/;
      if (!addressRegex.test(stringValue)) {
        throw new Error(`${fieldName} contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed`);
      }
    }

    // For general text fields - letters, numbers, spaces, and extended punctuation
    if (options.type === 'text') {
      const textRegex = /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.,;:()\-/'"&]+$/;
      if (!textRegex.test(stringValue)) {
        throw new Error(`${fieldName} contains invalid characters`);
      }
    }

    // For email fields
    if (options.type === 'email') {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(stringValue)) {
        throw new Error(`${fieldName} must be a valid email address`);
      }
    }

    // For phone numbers - only digits, spaces, hyphens, parentheses, and plus sign
    if (options.type === 'phone') {
      const phoneRegex = /^[\d\s\-()+ ]+$/;
      if (!phoneRegex.test(stringValue)) {
        throw new Error(`${fieldName} contains invalid characters. Only numbers and phone formatting characters are allowed`);
      }
      // Remove all non-digit characters and check length
      const digitsOnly = stringValue.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        throw new Error(`${fieldName} must contain between 7 and 15 digits`);
      }
    }

    return stringValue;
  }

  // Helper function to validate numeric fields
  static sanitizeNumericField(value, fieldName, options = {}) {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (options.integer && !Number.isInteger(numValue)) {
      throw new Error(`${fieldName} must be a whole number`);
    }

    if (options.min !== undefined && numValue < options.min) {
      throw new Error(`${fieldName} must be at least ${options.min}`);
    }

    if (options.max !== undefined && numValue > options.max) {
      throw new Error(`${fieldName} must not exceed ${options.max}`);
    }

    return numValue;
  }

  // Helper function to sanitize and validate application data
  static sanitizeApplicationData(data) {
    const sanitizedData = { ...data };
    
    // Remove protected fields
    delete sanitizedData.status;
    delete sanitizedData.approvalsSummary;

    try {
      // Sanitize basic fields
      if (sanitizedData.emailAddress) {
        sanitizedData.emailAddress = this.sanitizeTextField(sanitizedData.emailAddress, 'Email', { type: 'email', maxLength: 100 });
      }
      
      if (sanitizedData.firstName) {
        sanitizedData.firstName = this.sanitizeTextField(sanitizedData.firstName, 'First Name', { type: 'name', maxLength: 50 });
      }
      
      if (sanitizedData.middleName) {
        sanitizedData.middleName = this.sanitizeTextField(sanitizedData.middleName, 'Middle Name', { type: 'name', maxLength: 50 });
      }
      
      if (sanitizedData.lastName) {
        sanitizedData.lastName = this.sanitizeTextField(sanitizedData.lastName, 'Last Name', { type: 'name', maxLength: 50 });
      }
      
      if (sanitizedData.suffix) {
        sanitizedData.suffix = this.sanitizeTextField(sanitizedData.suffix, 'Suffix', { type: 'name', maxLength: 10 });
      }

      if (sanitizedData.programOfStudyAndYear) {
        sanitizedData.programOfStudyAndYear = this.sanitizeTextField(sanitizedData.programOfStudyAndYear, 'Program of Study', { type: 'text', maxLength: 100 });
      }

      if (sanitizedData.existingScholarship) {
        sanitizedData.existingScholarship = this.sanitizeTextField(sanitizedData.existingScholarship, 'Existing Scholarship', { type: 'text', maxLength: 100 });
      }

      if (sanitizedData.citizenship) {
        sanitizedData.citizenship = this.sanitizeTextField(sanitizedData.citizenship, 'Citizenship', { type: 'name', maxLength: 50 });
      }

      if (sanitizedData.civilStatus) {
        sanitizedData.civilStatus = this.sanitizeTextField(sanitizedData.civilStatus, 'Civil Status', { type: 'name', maxLength: 20 });
      }

      if (sanitizedData.currentResidenceAddress) {
        sanitizedData.currentResidenceAddress = this.sanitizeTextField(sanitizedData.currentResidenceAddress, 'Current Residence Address', { type: 'address', maxLength: 200 });
      }

      if (sanitizedData.permanentResidentialAddress) {
        sanitizedData.permanentResidentialAddress = this.sanitizeTextField(sanitizedData.permanentResidentialAddress, 'Permanent Address', { type: 'address', maxLength: 200 });
      }

      if (sanitizedData.contactNumber) {
        sanitizedData.contactNumber = this.sanitizeTextField(sanitizedData.contactNumber, 'Contact Number', { type: 'phone' });
      }

      // Sanitize numeric fields
      if (sanitizedData.remainingUnitsIncludingThisTerm !== undefined) {
        sanitizedData.remainingUnitsIncludingThisTerm = this.sanitizeNumericField(sanitizedData.remainingUnitsIncludingThisTerm, 'Remaining Units', { integer: true, min: 0, max: 300 });
      }

      if (sanitizedData.remainingTermsToGraduate !== undefined) {
        sanitizedData.remainingTermsToGraduate = this.sanitizeNumericField(sanitizedData.remainingTermsToGraduate, 'Remaining Terms', { integer: true, min: 0, max: 20 });
      }

      // Sanitize family background
      if (sanitizedData.familyBackground) {
        // Father's information
        if (sanitizedData.familyBackground.father) {
          const father = sanitizedData.familyBackground.father;
          if (father.firstName) father.firstName = this.sanitizeTextField(father.firstName, "Father's First Name", { type: 'name', maxLength: 50 });
          if (father.middleName) father.middleName = this.sanitizeTextField(father.middleName, "Father's Middle Name", { type: 'name', maxLength: 50 });
          if (father.lastName) father.lastName = this.sanitizeTextField(father.lastName, "Father's Last Name", { type: 'name', maxLength: 50 });
          if (father.suffix) father.suffix = this.sanitizeTextField(father.suffix, "Father's Suffix", { type: 'name', maxLength: 10 });
          if (father.age !== undefined) father.age = this.sanitizeNumericField(father.age, "Father's Age", { integer: true, min: 18, max: 120 });
          if (father.occupation) father.occupation = this.sanitizeTextField(father.occupation, "Father's Occupation", { type: 'text', maxLength: 100 });
          if (father.grossAnnualIncome) father.grossAnnualIncome = this.sanitizeTextField(father.grossAnnualIncome, "Father's Income", { type: 'text', maxLength: 50 });
          if (father.companyName) father.companyName = this.sanitizeTextField(father.companyName, "Father's Company Name", { type: 'text', maxLength: 100 });
          if (father.companyAddress) father.companyAddress = this.sanitizeTextField(father.companyAddress, "Father's Company Address", { type: 'address', maxLength: 200 });
          if (father.homeAddress) father.homeAddress = this.sanitizeTextField(father.homeAddress, "Father's Home Address", { type: 'address', maxLength: 200 });
          if (father.contactNumber) father.contactNumber = this.sanitizeTextField(father.contactNumber, "Father's Contact Number", { type: 'phone' });
        }

        // Mother's information
        if (sanitizedData.familyBackground.mother) {
          const mother = sanitizedData.familyBackground.mother;
          if (mother.firstName) mother.firstName = this.sanitizeTextField(mother.firstName, "Mother's First Name", { type: 'name', maxLength: 50 });
          if (mother.middleName) mother.middleName = this.sanitizeTextField(mother.middleName, "Mother's Middle Name", { type: 'name', maxLength: 50 });
          if (mother.lastName) mother.lastName = this.sanitizeTextField(mother.lastName, "Mother's Last Name", { type: 'name', maxLength: 50 });
          if (mother.suffix) mother.suffix = this.sanitizeTextField(mother.suffix, "Mother's Suffix", { type: 'name', maxLength: 10 });
          if (mother.age !== undefined) mother.age = this.sanitizeNumericField(mother.age, "Mother's Age", { integer: true, min: 18, max: 120 });
          if (mother.occupation) mother.occupation = this.sanitizeTextField(mother.occupation, "Mother's Occupation", { type: 'text', maxLength: 100 });
          if (mother.grossAnnualIncome) mother.grossAnnualIncome = this.sanitizeTextField(mother.grossAnnualIncome, "Mother's Income", { type: 'text', maxLength: 50 });
          if (mother.companyName) mother.companyName = this.sanitizeTextField(mother.companyName, "Mother's Company Name", { type: 'text', maxLength: 100 });
          if (mother.companyAddress) mother.companyAddress = this.sanitizeTextField(mother.companyAddress, "Mother's Company Address", { type: 'address', maxLength: 200 });
          if (mother.homeAddress) mother.homeAddress = this.sanitizeTextField(mother.homeAddress, "Mother's Home Address", { type: 'address', maxLength: 200 });
          if (mother.contactNumber) mother.contactNumber = this.sanitizeTextField(mother.contactNumber, "Mother's Contact Number", { type: 'phone' });
        }

        // Siblings
        if (sanitizedData.familyBackground.siblings && Array.isArray(sanitizedData.familyBackground.siblings)) {
          sanitizedData.familyBackground.siblings = sanitizedData.familyBackground.siblings.map((sibling, index) => {
            if (sibling.name) sibling.name = this.sanitizeTextField(sibling.name, `Sibling ${index + 1} Name`, { type: 'name', maxLength: 100 });
            if (sibling.age !== undefined) sibling.age = this.sanitizeNumericField(sibling.age, `Sibling ${index + 1} Age`, { integer: true, min: 0, max: 100 });
            if (sibling.programCurrentlyTakingOrFinished) sibling.programCurrentlyTakingOrFinished = this.sanitizeTextField(sibling.programCurrentlyTakingOrFinished, `Sibling ${index + 1} Program`, { type: 'text', maxLength: 100 });
            if (sibling.schoolOrOccupation) sibling.schoolOrOccupation = this.sanitizeTextField(sibling.schoolOrOccupation, `Sibling ${index + 1} School/Occupation`, { type: 'text', maxLength: 100 });
            return sibling;
          });
        }
      }

      // Sanitize education
      if (sanitizedData.education) {
        // Elementary
        if (sanitizedData.education.elementary) {
          const elem = sanitizedData.education.elementary;
          if (elem.nameAndAddressOfSchool) elem.nameAndAddressOfSchool = this.sanitizeTextField(elem.nameAndAddressOfSchool, 'Elementary School', { type: 'address', maxLength: 200 });
          if (elem.honorOrAwardsReceived) elem.honorOrAwardsReceived = this.sanitizeTextField(elem.honorOrAwardsReceived, 'Elementary Honors', { type: 'text', maxLength: 300 });
          if (elem.nameOfOrganizationAndPositionHeld) elem.nameOfOrganizationAndPositionHeld = this.sanitizeTextField(elem.nameOfOrganizationAndPositionHeld, 'Elementary Organizations', { type: 'text', maxLength: 300 });
          if (elem.generalAverage !== undefined) elem.generalAverage = this.sanitizeNumericField(elem.generalAverage, 'Elementary General Average', { min: 65, max: 100 });
          if (elem.rankAmongGraduates) elem.rankAmongGraduates = this.sanitizeTextField(elem.rankAmongGraduates, 'Elementary Rank', { type: 'text', maxLength: 50 });
          if (elem.contestTrainingsConferencesParticipated) elem.contestTrainingsConferencesParticipated = this.sanitizeTextField(elem.contestTrainingsConferencesParticipated, 'Elementary Activities', { type: 'text', maxLength: 500 });
        }

        // Secondary
        if (sanitizedData.education.secondary) {
          const sec = sanitizedData.education.secondary;
          if (sec.nameAndAddressOfSchool) sec.nameAndAddressOfSchool = this.sanitizeTextField(sec.nameAndAddressOfSchool, 'Secondary School', { type: 'address', maxLength: 200 });
          if (sec.honorOrAwardsReceived) sec.honorOrAwardsReceived = this.sanitizeTextField(sec.honorOrAwardsReceived, 'Secondary Honors', { type: 'text', maxLength: 300 });
          if (sec.nameOfOrganizationAndPositionHeld) sec.nameOfOrganizationAndPositionHeld = this.sanitizeTextField(sec.nameOfOrganizationAndPositionHeld, 'Secondary Organizations', { type: 'text', maxLength: 300 });
          if (sec.generalAverage !== undefined) sec.generalAverage = this.sanitizeNumericField(sec.generalAverage, 'Secondary General Average', { min: 65, max: 100 });
          if (sec.rankAmongGraduates) sec.rankAmongGraduates = this.sanitizeTextField(sec.rankAmongGraduates, 'Secondary Rank', { type: 'text', maxLength: 50 });
          if (sec.contestTrainingsConferencesParticipated) sec.contestTrainingsConferencesParticipated = this.sanitizeTextField(sec.contestTrainingsConferencesParticipated, 'Secondary Activities', { type: 'text', maxLength: 500 });
        }

        // College level
        if (sanitizedData.education.collegeLevel && Array.isArray(sanitizedData.education.collegeLevel)) {
          sanitizedData.education.collegeLevel = sanitizedData.education.collegeLevel.map((level, index) => {
            if (level.yearLevel !== undefined) level.yearLevel = this.sanitizeNumericField(level.yearLevel, `College Year ${index + 1}`, { integer: true, min: 1, max: 7 });
            if (level.firstSemesterAverageFinalGrade !== undefined) level.firstSemesterAverageFinalGrade = this.sanitizeNumericField(level.firstSemesterAverageFinalGrade, `Year ${index + 1} First Sem Grade`, { min: 1, max: 5 });
            
            // Second semester is optional - only validate if value is provided (not empty/null/undefined/0)
            if (level.secondSemesterAverageFinalGrade && level.secondSemesterAverageFinalGrade !== 0) {
              level.secondSemesterAverageFinalGrade = this.sanitizeNumericField(level.secondSemesterAverageFinalGrade, `Year ${index + 1} Second Sem Grade`, { min: 1, max: 5 });
            } else {
              // Clear out invalid optional values
              level.secondSemesterAverageFinalGrade = undefined;
            }
            
            // Third semester is optional - only validate if value is provided (not empty/null/undefined/0)
            if (level.thirdSemesterAverageFinalGrade && level.thirdSemesterAverageFinalGrade !== 0) {
              level.thirdSemesterAverageFinalGrade = this.sanitizeNumericField(level.thirdSemesterAverageFinalGrade, `Year ${index + 1} Third Sem Grade`, { min: 1, max: 5 });
            } else {
              // Clear out invalid optional values
              level.thirdSemesterAverageFinalGrade = undefined;
            }
            return level;
          });
        }

        // Current memberships
        if (sanitizedData.education.currentMembershipInOrganizations && Array.isArray(sanitizedData.education.currentMembershipInOrganizations)) {
          sanitizedData.education.currentMembershipInOrganizations = sanitizedData.education.currentMembershipInOrganizations.map((org, index) => {
            if (org.nameOfOrganization) org.nameOfOrganization = this.sanitizeTextField(org.nameOfOrganization, `Organization ${index + 1} Name`, { type: 'text', maxLength: 100 });
            if (org.position) org.position = this.sanitizeTextField(org.position, `Organization ${index + 1} Position`, { type: 'text', maxLength: 100 });
            return org;
          });
        }
      }

      // Sanitize references
      if (sanitizedData.references && Array.isArray(sanitizedData.references)) {
        sanitizedData.references = sanitizedData.references.map((ref, index) => {
          if (ref.name) ref.name = this.sanitizeTextField(ref.name, `Reference ${index + 1} Name`, { type: 'name', maxLength: 100 });
          if (ref.relationshipToTheApplicant) ref.relationshipToTheApplicant = this.sanitizeTextField(ref.relationshipToTheApplicant, `Reference ${index + 1} Relationship`, { type: 'text', maxLength: 100 });
          if (ref.contactNumber) ref.contactNumber = this.sanitizeTextField(ref.contactNumber, `Reference ${index + 1} Contact`, { type: 'phone' });
          return ref;
        });
      }

      // Sanitize CIT-U residency fields
      if (sanitizedData.citUResidency) {
        if (sanitizedData.citUResidency.semesterCount !== undefined) {
          sanitizedData.citUResidency.semesterCount = this.sanitizeNumericField(sanitizedData.citUResidency.semesterCount, 'Semester Count', { integer: true, min: 0, max: 20 });
        }
        if (sanitizedData.citUResidency.weightedAverageGrade !== undefined) {
          sanitizedData.citUResidency.weightedAverageGrade = this.sanitizeNumericField(sanitizedData.citUResidency.weightedAverageGrade, 'Weighted Average Grade', { min: 1, max: 5 });
        }
        if (sanitizedData.citUResidency.minimumUnitsCompleted !== undefined) {
          sanitizedData.citUResidency.minimumUnitsCompleted = this.sanitizeNumericField(sanitizedData.citUResidency.minimumUnitsCompleted, 'Minimum Units Completed', { integer: true, min: 0, max: 50 });
        }
      }

      return sanitizedData;
    } catch (error) {
      throw new Error(`Input validation failed: ${error.message}`);
    }
  }

  // Create a new application or update existing one
  static async createApplication(userId, applicationData) {
    try {
      const sanitizedData = ApplicationService.sanitizeApplicationData(applicationData);

      const existingApplication = await ApplicationForm.findOne({ user: userId, is_deleted: false });
      
      // If application exists, update it instead of throwing error
      if (existingApplication) {
        console.log('📝 Updating existing application for user:', userId);
        
        // Update the existing application
        Object.assign(existingApplication, sanitizedData);
        await existingApplication.save();

        // Log application update
        await ActivityLogger.logApplicationSubmission(
          userId, 
          existingApplication._id, 
          sanitizedData.typeOfScholarship || 'scholarship'
        );

        // Create notification for update
        await NotificationService.createApplicationSubmittedNotification(
          userId,
          existingApplication._id
        );

        return await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: existingApplication._id }))
          .select('-status -approvalsSummary');
      }

      // Create new application if none exists
      const application = new ApplicationForm({
        user: userId,
        ...sanitizedData
      });

      await application.save();

      // Log application submission
      await ActivityLogger.logApplicationSubmission(
        userId, 
        application._id, 
        sanitizedData.typeOfScholarship || 'scholarship'
      );

      // Create notification
      await NotificationService.createApplicationSubmittedNotification(
        userId,
        application._id
      );

      return await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: application._id }))
        .select('-status -approvalsSummary');
    } catch (error) {
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  // Get application by ID
  static async getApplicationById(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findOne({ _id: applicationId, is_deleted: false })
      .populate('user', 'name idNumber _id')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  // Get application by user ID
  static async getApplicationByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId, is_deleted: false })
      .populate('user', 'name idNumber _id')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    if (!application) {
      throw new Error('No application found for this user');
    }

    return application;
  }

  // Get user's own application
  static async getMyApplication(userId) {
    const application = await ApplicationForm.findOne({ user: userId, is_deleted: false });
    
    if (!application) {
      throw new Error('No application found for this user');
    }

    return application;
  }

  // Get all applications with pagination and filtering
  static async getAllApplications(queryParams) {
    const { page = 1, limit = 10, firstName, emailAddress, status } = queryParams;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (firstName) query.firstName = { $regex: firstName, $options: 'i' };
    if (emailAddress) query.emailAddress = { $regex: emailAddress, $options: 'i' };
    if (status) query.status = status;

    const applications = await ApplicationForm.find({ ...query, is_deleted: false })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('user', 'name idNumber _id')
      .populate('approvalsSummary.endorsedBy', 'name _id')
      .populate('approvalsSummary.approvedBy', 'name _id');

    const totalDocs = await ApplicationForm.countDocuments({ ...query, is_deleted: false });

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

  // Get all applications for staff dashboard
  static async getAllApplicationsForStaff() {
    console.log('🔍 Starting database query for applications...');
    
    // First, let's check total count without filters
    const totalCount = await ApplicationForm.countDocuments({});
    const deletedCount = await ApplicationForm.countDocuments({ is_deleted: true });
    const activeCount = await ApplicationForm.countDocuments({ is_deleted: false });
    
    console.log(`📊 Database stats: Total=${totalCount}, Deleted=${deletedCount}, Active=${activeCount}`);
    
    // Temporarily include applications without is_deleted field
    const applications = await ApplicationForm.find({ 
      $or: [
        { is_deleted: false },
        { is_deleted: { $exists: false } }
      ]
    })
      .populate('user', 'name email idNumber')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${applications.length} applications for staff dashboard`);
    console.log('📋 Application IDs:', applications.map(app => app._id));
    
    // Let's also check if there are applications without the is_deleted field
    const appsWithoutDeletedField = await ApplicationForm.find({ is_deleted: { $exists: false } })
      .populate('user', 'name email idNumber')
      .sort({ createdAt: -1 })
      .lean();
    console.log(`📋 Applications without is_deleted field: ${appsWithoutDeletedField.length}`);
    if (appsWithoutDeletedField.length > 0) {
      console.log('📋 IDs without is_deleted field:', appsWithoutDeletedField.map(app => app._id));
    }

    // Fetch interview data for all applications
    const Interview = require('../models/Interview');
    const applicationIds = applications.map(app => app._id);
    const interviews = await Interview.find({ applicationId: { $in: applicationIds } }).lean();
    
    // Create a map of applicationId -> interview
    const interviewMap = {};
    interviews.forEach(interview => {
      interviewMap[interview.applicationId.toString()] = interview;
    });

    const formattedApps = applications.map(app => {
      const interview = interviewMap[app._id.toString()];
      
      return {
        _id: app._id,
        firstName: app.firstName || '',
        lastName: app.lastName || '',
        middleName: app.middleName || '',
        suffix: app.suffix || '',
        emailAddress: app.emailAddress || '',
        gender: app.gender || 'Unknown',
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
        user: app.user,
        // Add interview data
        interviewScheduled: !!interview,
        interviewDate: interview?.startTime || null,
        interviewCompleted: interview?.status === 'complete' || false,
        interviewStatus: interview?.status || null
      };
    });

    console.log(`✅ Returning ${formattedApps.length} formatted applications with interview data`);
    return formattedApps;
  }

  // Update application by ID
  static async updateApplicationById(applicationId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID');
    }

    const sanitizedData = ApplicationService.sanitizeApplicationData(updateData);

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const currentApplication = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }));
    if (!currentApplication) {
      throw new Error('Application not found');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }),
      { $set: sanitizedData },
      { new: true, runValidators: false }
    ).select('-status -approvalsSummary');

    return updatedApplication;
  }

  // Update application by user ID
  static async updateApplicationByUserId(userId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const sanitizedData = ApplicationService.sanitizeApplicationData(updateData);

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const currentApplication = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ user: userId }),
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).select('-status -approvalsSummary');

    return updatedApplication;
  }

  // Update user's own application
  static async updateMyApplication(userId, updateData) {
    const sanitizedData = ApplicationService.sanitizeApplicationData(updateData);

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const currentApplication = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ user: userId }),
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).select('-status -approvalsSummary');

    return updatedApplication;
  }

  // Delete application by ID
  static async deleteApplicationById(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID');
    }

    const application = await ApplicationForm.findOne({ _id: applicationId, is_deleted: false });
    if (!application) {
      throw new Error('Application not found');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(application);

    await ApplicationForm.findByIdAndUpdate(applicationId, { is_deleted: true });
    return { message: 'Application soft deleted successfully' };
  }

  // Delete application by user ID
  static async deleteApplicationByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId, is_deleted: false });
    if (!application) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(application);

    await ApplicationForm.findOneAndUpdate({ user: userId }, { is_deleted: true });
    return { message: 'Application soft deleted successfully' };
  }

  // Delete application form only (keep documents)
  static async deleteApplicationFormOnly(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findOne({ _id: applicationId, is_deleted: false }).populate('user', 'name email');
    if (!application) {
      throw new Error('Application not found');
    }

    await ApplicationForm.findByIdAndUpdate(applicationId, { is_deleted: true });

    return {
      message: `Application form for ${application.firstName} ${application.lastName} has been deleted. Documents are preserved for reuse.`,
      deletedData: {
        applicationId: application._id,
        studentName: `${application.firstName} ${application.lastName}`,
        documentsPreserved: true
      }
    };
  }

  // Delete documents only (keep application form)
  static async deleteDocumentsOnly(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findOne({ _id: applicationId, is_deleted: false }).populate('user', 'name email');
    if (!application) {
      throw new Error('Application not found');
    }

    try {
      const DocumentUpload = require('../models/DocumentUpload');
      const docResult = await DocumentUpload.deleteOne({ user: application.user._id });
      
      if (docResult.deletedCount === 0) {
        throw new Error('No documents found to delete');
      }

      return {
        message: `Documents for ${application.firstName} ${application.lastName} have been deleted. Application form is preserved.`
      };
    } catch (docError) {
      throw new Error(`Failed to delete documents: ${docError.message}`);
    }
  }

  // Set approval summary
  static async setApprovalSummary(userId, approvalData) {
    const { endorsedBy, approvedBy } = approvalData;

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

    const currentApplication = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ user: userId }),
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
    
    const currentApplication = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
    if (!currentApplication) {
      throw new Error('No application found for this user');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ user: userId }),
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
  static async setStatusById(applicationId, status, updatedBy) {
    if (!status) {
      throw new Error('Status is required');
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const currentApplication = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }));
    if (!currentApplication) {
      throw new Error('Application not found');
    }

    // Create history entry
    await ApplicationService.createApplicationHistory(currentApplication);

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }),
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
  static async getApplicationHistoryById(historyId) {
    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      throw new Error('Invalid history ID');
    }

    const historyEntry = await ApplicationHistory.findById(historyId)
      .populate('user', 'name idNumber _id');

    if (!historyEntry) {
      throw new Error('History entry not found');
    }

    return historyEntry;
  }

  // Get user's application history
  static async getMyApplicationHistory(userId) {
    const history = await ApplicationHistory.find({ user: userId })
      .sort({ createdAt: -1 });

    return history;
  }

  // Update application status
  static async updateApplicationStatus(applicationId, status) {
    const application = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }),
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
  static async getApplicationDetails(applicationId) {
    const application = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }))
      .populate('user', 'name email idNumber')
      .lean();

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  // Get application documents
  static async getApplicationDocuments(applicationId) {
    const application = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }));
    if (!application) {
      throw new Error('Application not found');
    }

    const DocumentUpload = require('../models/DocumentUpload');
    const documents = await DocumentUpload.findOne({ user: application.user });

    return {
      studentPicture: !!(documents?.studentPicture),
      nbiClearance: !!(documents?.nbiClearance),
      gradeReport: !!(documents?.gradeReport),
      incomeTaxReturn: !!(documents?.incomeTaxReturn),
      goodMoralCertificate: !!(documents?.goodMoralCertificate),
      physicalCheckup: !!(documents?.physicalCheckup),
      homeLocationSketch: !!(documents?.homeLocationSketch)
    };
  }

  // Get documents by application ID with detailed info
  static async getApplicationDocumentsByAppId(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }));
    if (!application) {
      throw new Error('Application not found');
    }

    const DocumentUpload = require('../models/DocumentUpload');
    const documents = await DocumentUpload.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: application.user }));

    // Debug logging
    console.log('📄 Raw documents from DB:', {
      studentPicture: documents?.studentPicture,
      nbiClearance: documents?.nbiClearance?.[0],
      gradeReport: documents?.gradeReport?.[0]
    });

    const documentStatus = {
      studentPicture: {
        uploaded: !!(documents?.studentPicture),
        filePath: documents?.studentPicture && typeof documents.studentPicture === 'string' 
          ? documents.studentPicture 
          : documents?.studentPicture?.filePath || null,
        originalName: documents?.studentPicture && typeof documents.studentPicture === 'string' 
          ? documents.studentPicture 
          : documents?.studentPicture?.originalName || null,
        filename: documents?.studentPicture && typeof documents.studentPicture === 'string' 
          ? documents.studentPicture 
          : documents?.studentPicture?.originalName || null,
        uploadedAt: documents?.createdAt
      },
      nbiClearance: {
        uploaded: !!(documents?.nbiClearance),
        filePath: documents?.nbiClearance?.[0]?.filePath || null,
        originalName: documents?.nbiClearance?.[0]?.originalName || null,
        filename: documents?.nbiClearance?.[0]?.originalName || null,
        uploadedAt: documents?.createdAt
      },
      gradeReport: {
        uploaded: !!(documents?.gradeReport),
        filePath: documents?.gradeReport?.[0]?.filePath || null,
        originalName: documents?.gradeReport?.[0]?.originalName || null,
        filename: documents?.gradeReport?.[0]?.originalName || null,
        uploadedAt: documents?.createdAt
      },
      incomeTaxReturn: {
        uploaded: !!(documents?.incomeTaxReturn),
        filePath: documents?.incomeTaxReturn?.[0]?.filePath || null,
        originalName: documents?.incomeTaxReturn?.[0]?.originalName || null,
        filename: documents?.incomeTaxReturn?.[0]?.originalName || null,
        uploadedAt: documents?.createdAt
      },
      goodMoralCertificate: {
        uploaded: !!(documents?.goodMoralCertificate),
        filePath: documents?.goodMoralCertificate?.[0]?.filePath || null,
        originalName: documents?.goodMoralCertificate?.[0]?.originalName || null,
        filename: documents?.goodMoralCertificate?.[0]?.originalName || null,
        uploadedAt: documents?.createdAt
      },
      physicalCheckup: {
        uploaded: !!(documents?.physicalCheckup),
        filePath: documents?.physicalCheckup?.[0]?.filePath || null,
        originalName: documents?.physicalCheckup?.[0]?.originalName || null,
        filename: documents?.physicalCheckup?.[0]?.originalName || null,
        uploadedAt: documents?.createdAt
      },
      homeLocationSketch: {
        uploaded: !!(documents?.homeLocationSketch),
        filePath: documents?.homeLocationSketch?.[0]?.filePath || null,
        originalName: documents?.homeLocationSketch?.[0]?.originalName || null,
        filename: documents?.homeLocationSketch?.[0]?.originalName || null,
        uploadedAt: documents?.createdAt
      }
    };

    const totalRequired = 7;
    const totalUploaded = Object.values(documentStatus).filter(doc => doc.uploaded).length;

    const result = {
      documents: documentStatus,
      gradeAverages: documents?.gradeAverages || null,
      incomeTaxInfo: documents?.incomeTaxInfo || null,
      userId: application.user,
      summary: {
        totalRequired,
        totalUploaded,
        completionRate: Math.round((totalUploaded / totalRequired) * 100),
        isComplete: totalUploaded === totalRequired
      }
    };

    // Debug logging
    console.log('📤 Sending to frontend:', {
      studentPicture: result.documents.studentPicture,
      nbiClearance: result.documents.nbiClearance
    });

    return result;
  }

  // Delete application with cleanup
  static async deleteApplicationWithCleanup(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }))
      .populate('user', 'name email');
      
    if (!application) {
      throw new Error('Application not found');
    }

    // Delete associated documents
    try {
      const DocumentUpload = require('../models/DocumentUpload');
      await DocumentUpload.deleteOne({ user: application.user });
      console.log('🗑️ Associated documents deleted');
    } catch (docError) {
      console.log('⚠️ Could not delete documents:', docError.message);
    }

    // Create deletion notification
    try {
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
    await SoftDeleteUtils.softDeleteById(ApplicationForm, applicationId);

    return {
      message: `Application for ${application.firstName} ${application.lastName} has been deleted successfully`,
      deletedApplication: {
        id: application._id,
        name: `${application.firstName} ${application.lastName}`,
        email: application.emailAddress
      }
    };
  }

  // Verify application form
  static async verifyApplicationForm(applicationId, verifiedBy) {
    const application = await ApplicationForm.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId })).populate('user');
    if (!application) {
      throw new Error('Application not found');
    }

    const updatedApplication = await ApplicationForm.findOneAndUpdate(
      SoftDeleteUtils.addSoftDeleteFilter({ _id: applicationId }),
      { 
        status: 'form_verified',
        verifiedAt: new Date(),
        verifiedBy: verifiedBy
      },
      { new: true }
    );

    // Create notification for student
    try {
      await NotificationService.createApplicationFormVerifiedNotification(
        application.user._id,
        applicationId
      );
      console.log('📱 Notification sent to student');
    } catch (notificationError) {
      console.warn('⚠️ Failed to send notification:', notificationError.message);
    }

    return {
      id: updatedApplication._id,
      status: updatedApplication.status,
      verifiedAt: updatedApplication.verifiedAt
    };
  }

  // Verify application documents
  static async verifyApplicationDocuments(applicationId, verifiedBy) {
    const application = await ApplicationForm.findById(applicationId).populate('user');
    if (!application) {
      throw new Error('Application not found');
    }

    const updatedApplication = await ApplicationForm.findByIdAndUpdate(
      applicationId,
      { 
        status: 'document_verification',
        documentsVerifiedAt: new Date(),
        documentsVerifiedBy: verifiedBy
      },
      { new: true }
    );

    // Create notifications for student
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
    }

    return {
      id: updatedApplication._id,
      status: updatedApplication.status,
      documentsVerifiedAt: updatedApplication.documentsVerifiedAt
    };
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    const stats = await ApplicationForm.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

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

    return {
      newApplications,        // Status: "pending"
      documentVerifications,  // Status: "form_verified" 
      scheduledInterviews,    // Status: "document_verification"
      activeScholars         // Status: "approved"
    };
  }

  // Auto-complete application when personality test is completed
  static async autoCompleteApplication(userId, reason) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    // Check if application is already approved or rejected
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

    // Create history entry before updating
    await ApplicationService.createApplicationHistory(application);

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

    console.log(`✅ Application ${application._id} auto-completed for user ${userId}`);

    return {
      message: 'Application auto-completed successfully',
      status: 'approved',
      applicationId: application._id
    };
  }

  // Generate PDF for application
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
        // Add gender field
        gender: application.gender || 'N/A',
        // Add CIT-U residency fields
        isCitUSeniorHighGraduate: application.isCitUSeniorHighGraduate || false,
        citUResidency: {
          semesterCount: application.citUResidency?.semesterCount || 0,
          weightedAverageGrade: application.citUResidency?.weightedAverageGrade || 0,
          hasFailingMarks: application.citUResidency?.hasFailingMarks || false,
          minimumUnitsCompleted: application.citUResidency?.minimumUnitsCompleted || 0
        },
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
            yearLevel: ApplicationService.formatYearLevel(item.yearLevel),
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

      // Handle citUResidency fields
      for (const field in data.citUResidency) {
        replaceScalar(`citUResidency.${field}`, data.citUResidency[field]);
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

      // Handle {{#if}} statements
      html = html.replace(/{{#if ([^}]+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, (match, condition, ifContent, elseContent) => {
        const path = condition.split('.');
        const value = path.reduce((obj, k) => obj?.[k], data);
        return value && (Array.isArray(value) ? value.length : value) ? ifContent : elseContent;
      });

      // Handle {{#unless}} statements
      html = html.replace(/{{#unless ([^}]+)}}([\s\S]*?){{\/unless}}/g, (match, condition, unlessContent) => {
        const path = condition.split('.');
        const value = path.reduce((obj, k) => obj?.[k], data);
        return !value || (Array.isArray(value) && value.length === 0) ? unlessContent : '';
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

  // Export application as PDF by user ID
  static async exportApplicationAsPDFByUserId(userId) {
    console.log('🔍 PDF request - Received ID:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found in database');
    }
    
    console.log('✅ User found:', user.name, user.email);

    const application = await ApplicationForm.findOne({ user: userId })
      .populate('user', 'name email')
      .lean();
      
    if (!application) {
      throw new Error('No application found for this user');
    }

    console.log('✅ Application found, generating PDF...');
    
    const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
    const pdfBuffer = await ApplicationService.generateApplicationPDF(application, templatePath);

    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

    return {
      pdfBuffer,
      filename: `application-form-${application._id}.pdf`
    };
  }

  // Export user's own application as PDF
  static async exportMyApplicationAsPDF(userId) {
    const application = await ApplicationForm.findOne({ user: userId })
      .populate('user', 'name email')
      .lean();
      
    if (!application) {
      throw new Error('Application not found for this user');
    }

    const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
    const pdfBuffer = await ApplicationService.generateApplicationPDF(application, templatePath);

    // Log PDF export
    await ActivityLogger.logPDFExport(userId, application._id);

    return {
      pdfBuffer,
      filename: `application-form-${application._id}.pdf`
    };
  }

  // Export PDF using application ID
  static async exportApplicationAsPDFByApplicationId(applicationId) {
    console.log('🔍 PDF request - Application ID:', applicationId);

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

    console.log('✅ Application found with user:', application.user.name);

    const templatePath = path.join(__dirname, '../pdf-templates/application-form.html');
    const pdfBuffer = await ApplicationService.generateApplicationPDF(application, templatePath);

    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

    return {
      pdfBuffer,
      filename: `application-${application.firstName}-${application.lastName}.pdf`
    };
  }

  // Get user activity history
  static async getMyActivityHistory(userId, limit = 50) {
    const history = await ActivityLogger.getUserActivityHistory(userId, limit);
    return history;
  }

  // Get user activity history (admin)
  static async getUserActivityHistory(userId, limit = 50) {
    const history = await ActivityLogger.getUserActivityHistory(userId, limit);
    return history;
  }

  // Test database connection
  static async testDatabaseConnection() {
    const mongoose = require('mongoose');
    const count = await ApplicationForm.countDocuments();
    
    return { 
      message: 'Database connection OK', 
      applicationCount: count,
      dbState: mongoose.connection.readyState 
    };
  }

  // Soft Delete Methods
  static async softDeleteApplication(applicationId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(ApplicationForm, applicationId);
      await ActivityLogger.logApplicationUpdate(
        result.user, 
        applicationId, 
        'application_soft_deleted'
      );
      return { message: 'Application soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting application:', error);
      throw error;
    }
  }

  static async restoreApplication(applicationId) {
    try {
      const result = await SoftDeleteUtils.restoreById(ApplicationForm, applicationId);
      await ActivityLogger.logApplicationUpdate(
        result.user, 
        applicationId, 
        'application_restored'
      );
      return { message: 'Application restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring application:', error);
      throw error;
    }
  }

  static async permanentDeleteApplication(applicationId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(ApplicationForm, applicationId);
      return { message: 'Application permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting application:', error);
      throw error;
    }
  }

  static async getSoftDeletedApplications(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(ApplicationForm, query);
    } catch (error) {
      console.error('Error getting soft deleted applications:', error);
      throw error;
    }
  }

  // Soft delete application form only (keep documents)
  static async softDeleteApplicationFormOnly(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findOne({ _id: applicationId, is_deleted: false }).populate('user', 'name email');
    if (!application) {
      throw new Error('Application not found');
    }

    // Use soft delete to mark as deleted without removing from database
    await ApplicationForm.findByIdAndUpdate(applicationId, { is_deleted: true });

    return {
      message: `Application form for ${application.firstName} ${application.lastName} has been soft deleted. Documents are preserved for reuse.`,
      deletedData: {
        applicationId: application._id,
        studentName: `${application.firstName} ${application.lastName}`,
        documentsPreserved: true,
        canRestore: true
      }
    };
  }

  // Soft delete documents only (keep application form)
  static async softDeleteDocumentsOnly(applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const application = await ApplicationForm.findOne({ _id: applicationId, is_deleted: false }).populate('user', 'name email');
    if (!application) {
      throw new Error('Application not found');
    }

    try {
      const DocumentUpload = require('../models/DocumentUpload');
      
      // Soft delete documents instead of permanent delete
      const docResult = await DocumentUpload.updateOne(
        { user: application.user._id },
        { is_deleted: true }
      );
      
      if (docResult.matchedCount === 0) {
        throw new Error('No documents found to delete');
      }

      return {
        message: `Documents for ${application.firstName} ${application.lastName} have been soft deleted. Application form is preserved.`,
        deletedData: {
          applicationId: application._id,
          studentName: `${application.firstName} ${application.lastName}`,
          formPreserved: true,
          canRestore: true
        }
      };
    } catch (docError) {
      throw new Error(`Failed to soft delete documents: ${docError.message}`);
    }
  }

  // Export all application forms to CSV
  static async exportAllApplicationsToCSV() {
    try {
      // Get all non-deleted applications with user data
      const applications = await ApplicationForm.find({ is_deleted: false })
        .populate('user', 'name email idNumber')
        .populate('verifiedBy', 'name')
        .populate('documentsVerifiedBy', 'name')
        .populate('approvalsSummary.endorsedBy', 'name')
        .populate('approvalsSummary.approvedBy', 'name')
        .lean();

      if (!applications || applications.length === 0) {
        throw new Error('No applications found to export');
      }

      // Define CSV headers
      const headers = [
        'ID Number',
        'Email',
        'First Name',
        'Middle Name',
        'Last Name',
        'Suffix',
        'Gender',
        'Program of Study and Year',
        'Year Level',
        'SHS Graduate CIT',
        'CIT-U Senior High Graduate',
        'Existing Scholarship',
        'Remaining Units',
        'Remaining Terms to Graduate',
        'Citizenship',
        'Civil Status',
        'Annual Family Income',
        'Current Residence Address',
        'Residing At',
        'Permanent Residential Address',
        'Contact Number',
        'Father First Name',
        'Father Middle Name',
        'Father Last Name',
        'Father Suffix',
        'Father Age',
        'Father Occupation',
        'Father Gross Annual Income',
        'Father Company Name',
        'Father Company Address',
        'Father Home Address',
        'Father Contact Number',
        'Mother First Name',
        'Mother Middle Name',
        'Mother Last Name',
        'Mother Suffix',
        'Mother Age',
        'Mother Occupation',
        'Mother Gross Annual Income',
        'Mother Company Name',
        'Mother Company Address',
        'Mother Home Address',
        'Mother Contact Number',
        'Siblings',
        'Elementary School',
        'Elementary Honors/Awards',
        'Elementary Organizations',
        'Elementary General Average',
        'Elementary Rank',
        'Elementary Contests/Trainings',
        'Secondary School',
        'Secondary Honors/Awards',
        'Secondary Organizations',
        'Secondary General Average',
        'Secondary Rank',
        'Secondary Contests/Trainings',
        'College Grades',
        'Current Memberships',
        'References',
        'Status',
        'Verified At',
        'Verified By',
        'Documents Verified At',
        'Documents Verified By',
        'Endorsed By',
        'Approved By',
        'Created At',
        'Updated At'
      ];

      // Helper function to escape CSV values
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Format siblings array
      const formatSiblings = (siblings) => {
        if (!siblings || siblings.length === 0) return '';
        return siblings.map(s => 
          `${s.name || 'N/A'} (Age: ${s.age || 'N/A'}, ${s.programCurrentlyTakingOrFinished || 'N/A'}, ${s.schoolOrOccupation || 'N/A'})`
        ).join('; ');
      };

      // Format college grades
      const formatCollegeGrades = (collegeLevel) => {
        if (!collegeLevel || collegeLevel.length === 0) return '';
        return collegeLevel.map(level => 
          `Year ${level.yearLevel || 'N/A'}: 1st=${level.firstSemesterAverageFinalGrade || 'N/A'}, 2nd=${level.secondSemesterAverageFinalGrade || 'N/A'}, 3rd=${level.thirdSemesterAverageFinalGrade || 'N/A'}`
        ).join('; ');
      };

      // Format current memberships
      const formatMemberships = (memberships) => {
        if (!memberships || memberships.length === 0) return '';
        return memberships.map(m => 
          `${m.nameOfOrganization || 'N/A'} (${m.position || 'N/A'})`
        ).join('; ');
      };

      // Format references
      const formatReferences = (references) => {
        if (!references || references.length === 0) return '';
        return references.map(r => 
          `${r.name || 'N/A'} (${r.relationshipToTheApplicant || 'N/A'}, ${r.contactNumber || 'N/A'})`
        ).join('; ');
      };

      // Format date
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
      };

      // Build CSV rows
      const rows = applications.map(app => {
        const father = app.familyBackground?.father || {};
        const mother = app.familyBackground?.mother || {};
        const elementary = app.education?.elementary || {};
        const secondary = app.education?.secondary || {};

        return [
          app.user?.idNumber || '',
          app.emailAddress || app.user?.email || '',
          app.firstName || '',
          app.middleName || '',
          app.lastName || '',
          app.suffix || '',
          app.gender || '',
          app.programOfStudyAndYear || '',
          app.yearLevel || '',
          app.shsgraduateCIT ? 'Yes' : 'No',
          app.isCitUSeniorHighGraduate ? 'Yes' : 'No',
          app.existingScholarship || '',
          app.remainingUnitsIncludingThisTerm || '',
          app.remainingTermsToGraduate || '',
          app.citizenship || '',
          app.civilStatus || '',
          app.annualFamilyIncome || '',
          app.currentResidenceAddress || '',
          app.residingAt || '',
          app.permanentResidentialAddress || '',
          app.contactNumber || '',
          father.firstName || '',
          father.middleName || '',
          father.lastName || '',
          father.suffix || '',
          father.age || '',
          father.occupation || '',
          father.grossAnnualIncome || '',
          father.companyName || '',
          father.companyAddress || '',
          father.homeAddress || '',
          father.contactNumber || '',
          mother.firstName || '',
          mother.middleName || '',
          mother.lastName || '',
          mother.suffix || '',
          mother.age || '',
          mother.occupation || '',
          mother.grossAnnualIncome || '',
          mother.companyName || '',
          mother.companyAddress || '',
          mother.homeAddress || '',
          mother.contactNumber || '',
          formatSiblings(app.familyBackground?.siblings),
          elementary.nameAndAddressOfSchool || '',
          elementary.honorOrAwardsReceived || '',
          elementary.nameOfOrganizationAndPositionHeld || '',
          elementary.generalAverage || '',
          elementary.rankAmongGraduates || '',
          elementary.contestTrainingsConferencesParticipated || '',
          secondary.nameAndAddressOfSchool || '',
          secondary.honorOrAwardsReceived || '',
          secondary.nameOfOrganizationAndPositionHeld || '',
          secondary.generalAverage || '',
          secondary.rankAmongGraduates || '',
          secondary.contestTrainingsConferencesParticipated || '',
          formatCollegeGrades(app.education?.collegeLevel),
          formatMemberships(app.education?.currentMembershipInOrganizations),
          formatReferences(app.references),
          app.status || '',
          formatDate(app.verifiedAt),
          app.verifiedBy?.name || '',
          formatDate(app.documentsVerifiedAt),
          app.documentsVerifiedBy?.name || '',
          app.approvalsSummary?.endorsedBy?.name || '',
          app.approvalsSummary?.approvedBy?.name || '',
          formatDate(app.createdAt),
          formatDate(app.updatedAt)
        ].map(escapeCSV);
      });

      // Combine headers and rows
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return {
        csv: csvContent,
        filename: `applications_export_${new Date().toISOString().split('T')[0]}.csv`,
        count: applications.length
      };
    } catch (error) {
      console.error('Error exporting applications to CSV:', error);
      throw error;
    }
  }
}

module.exports = ApplicationService;