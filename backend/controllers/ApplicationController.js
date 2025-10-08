const ApplicationService = require('../services/ApplicationService');
const ApplicationForm = require('../models/ApplicationForm');

const ApplicationController = {
  // POST: Create a new application for the authenticated user
  async createApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const applicationData = req.body;

      const application = await ApplicationService.createApplication(userId, applicationData);

      res.status(201).json({
        message: 'Application created successfully',
        application
      });
    } catch (error) {
      console.error('Error in createApplicationForm:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // GET: Read application by ID (admin)
  async readApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const application = await ApplicationService.getApplicationById(id);

      res.json({
        message: 'Application retrieved successfully',
        application
      });
    } catch (error) {
      console.error('Error in readApplicationFormById:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Read application by user ID (admin)
  async readApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const application = await ApplicationService.getApplicationByUserId(userId);

      res.json({
        message: 'Application retrieved successfully',
        application
      });
    } catch (error) {
      console.error('Error in readApplicationFormByUserId:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Read the authenticated user's application
  async readMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationService.getMyApplication(userId);

      res.json({
        message: 'Application retrieved successfully',
        application
      });
    } catch (error) {
      console.error('Error in readMyApplicationForm:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve all applications with pagination and filtering
  async getAllApplicationForms(req, res) {
    try {
      const result = await ApplicationService.getAllApplications(req.query);
      
      res.json({
        message: 'Applications retrieved successfully',
        applications: result.applications,
        pagination: result.pagination
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
      
      const formattedApplications = await ApplicationService.getAllApplicationsForStaff();
      console.log(`📊 Found ${formattedApplications.length} applications`);

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
      const updateData = req.body;

      const updatedApplication = await ApplicationService.updateApplicationById(id, updateData);

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error in updateApplicationFormById:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('No valid fields')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update application: ${error.message}` });
    }
  },

  // PATCH: Update application by user ID (admin, excluding status and approvalsSummary)
  async updateApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const updatedApplication = await ApplicationService.updateApplicationByUserId(userId, updateData);

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error in updateApplicationFormByUserId:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('No valid fields')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update application: ${error.message}` });
    }
  },

  // PATCH: Update the authenticated user's application (excluding status and approvalsSummary)
  async updateMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const updatedApplication = await ApplicationService.updateMyApplication(userId, updateData);

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error in updateMyApplicationForm:', error);
      if (error.message.includes('not found') || error.message.includes('No valid fields')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update application: ${error.message}` });
    }
  },

  // DELETE: Delete application by ID (admin)
  async deleteApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.deleteApplicationById(id);

      res.json(result);
    } catch (error) {
      console.error('Error in deleteApplicationFormById:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete application by user ID (admin)
  async deleteApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await ApplicationService.deleteApplicationByUserId(userId);

      res.json(result);
    } catch (error) {
      console.error('Error in deleteApplicationFormByUserId:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete only application form (keep documents)
  async deleteApplicationFormOnly(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🗑️ Delete APPLICATION FORM ONLY for:', applicationId);

      const result = await ApplicationService.deleteApplicationFormOnly(applicationId);
      console.log('✅ Application form deleted - Documents preserved');

      res.json({
        success: true,
        message: result.message,
        deletedData: result.deletedData
      });

    } catch (error) {
      console.error('❌ Error deleting application form:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Failed to delete application form', error: error.message });
    }
  },

  // DELETE: Delete only documents (keep application form)
  async deleteDocumentsOnly(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🗑️ Delete DOCUMENTS ONLY for:', applicationId);

      const result = await ApplicationService.deleteDocumentsOnly(applicationId);
      console.log('✅ Documents deleted - Application form preserved');

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('❌ Error deleting documents:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('No documents found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // PUT: Set approvalsSummary for the authenticated user's application
  async setApprovalSummary(req, res) {
    try {
      const userId = req.user.id;
      const approvalData = req.body;

      const approvalsSummary = await ApplicationService.setApprovalSummary(userId, approvalData);

      res.json({
        message: 'Approvals summary updated successfully',
        approvalsSummary
      });
    } catch (error) {
      console.error('Error in setApprovalSummary:', error);
      if (error.message.includes('must be provided') || error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update approvals summary: ${error.message}` });
    }
  },

  // PUT: Set status for the authenticated user's application
  async setStatus(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.body;

      const updatedStatus = await ApplicationService.setStatus(userId, status);

      res.json({
        message: 'Status updated successfully',
        status: updatedStatus
      });
    } catch (error) {
      console.error('Error in setStatus:', error);
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update status: ${error.message}` });
    }
  },

  // GET: Retrieve application history by user ID (admin)
  async getApplicationHistoryByUserId(req, res) {
    try {
      const { userId } = req.params;
      const history = await ApplicationService.getApplicationHistoryByUserId(userId);

      res.json({
        message: 'Application history retrieved successfully',
        history
      });
    } catch (error) {
      console.error('Error in getApplicationHistoryByUserId:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve application history by history ID (admin)
  async getApplicationHistoryById(req, res) {
    try {
      const { id } = req.params;
      const historyEntry = await ApplicationService.getApplicationHistoryById(id);

      res.json({
        message: 'History entry retrieved successfully',
        historyEntry
      });
    } catch (error) {
      console.error('Error in getApplicationHistoryById:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve the authenticated user's application history
  async getMyApplicationHistory(req, res) {
    try {
      const userId = req.user.id;
      const history = await ApplicationService.getMyApplicationHistory(userId);

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
      const result = await ApplicationService.exportApplicationAsPDFByUserId(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${result.filename}`,
        'Content-Length': result.pdfBuffer.length
      });
      
      res.send(result.pdfBuffer);
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // GET: Export authenticated user's application form as PDF
  async exportMyApplicationFormAsPDF(req, res) {
    try {
      const userId = req.user.id;
      const result = await ApplicationService.exportMyApplicationAsPDF(userId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${result.filename}`,
        'Content-Length': result.pdfBuffer.length
      });
      res.send(result.pdfBuffer);
    } catch (error) {
      console.error('Error in exportMyApplicationFormAsPDF:', error.message, error.stack);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // Export PDF using application ID (finds user automatically)
  async exportApplicationFormAsPDFByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🔍 PDF request - Application ID:', applicationId);

      const result = await ApplicationService.exportApplicationAsPDFByApplicationId(applicationId);
      console.log('✅ PDF generated, size:', result.pdfBuffer.length, 'bytes');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${result.filename}`,
        'Content-Length': result.pdfBuffer.length
      });
      
      res.send(result.pdfBuffer);
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Failed to generate PDF: ${error.message}` });
    }
  },

  // ADD: New method to get user activity history
  async getMyActivityHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;

      const history = await ApplicationService.getMyActivityHistory(userId, parseInt(limit));

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

      const history = await ApplicationService.getUserActivityHistory(userId, parseInt(limit));

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

      const application = await ApplicationService.updateApplicationStatus(id, status);

      res.json({ success: true, application });
    } catch (error) {
      console.error('❌ Error updating status:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get application details
  async getApplicationDetails(req, res) {
    try {
      const application = await ApplicationService.getApplicationDetails(req.params.id);

      res.json({ success: true, application });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get document status
  async getApplicationDocuments(req, res) {
    try {
      const documentStatus = await ApplicationService.getApplicationDocuments(req.params.id);

      res.json({ success: true, documents: documentStatus });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get documents by application ID for OAS staff
  async getApplicationDocumentsByAppId(req, res) {
    try {
      const { applicationId } = req.params;
      console.log('🔍 Getting documents for application:', applicationId);

      const result = await ApplicationService.getApplicationDocumentsByAppId(applicationId);
      console.log('� Processed document status:', result.documents);

      res.json({
        success: true,
        documents: result.documents,
        summary: result.summary
      });

    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
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

      const result = await ApplicationService.deleteApplicationWithCleanup(applicationId);
      console.log('✅ Application deleted successfully');

      res.json({
        success: true,
        message: result.message,
        deletedApplication: result.deletedApplication
      });

    } catch (error) {
      console.error('❌ Error deleting application:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
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

      const result = await ApplicationService.verifyApplicationForm(applicationId, req.user.id);
      console.log('✅ Application form verified, new status:', result.status);

      res.json({
        success: true,
        message: 'Application form verified successfully',
        application: result
      });

    } catch (error) {
      console.error('❌ Backend: Error verifying application:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
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

      const result = await ApplicationService.verifyApplicationDocuments(applicationId, req.user.id);
      console.log('✅ Documents verified, new status:', result.status);

      res.json({
        success: true,
        message: 'Documents verified successfully',
        application: result
      });

    } catch (error) {
      console.error('❌ Backend: Error verifying documents:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
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
      const result = await ApplicationService.testDatabaseConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: 'Database error', 
        error: error.message 
      });
    }
  },

  // ADD: New method to get dashboard stats
  async getDashboardStats(req, res) {
    try {
      console.log('✅ Backend: Getting dashboard stats...');

      const dashboardStats = await ApplicationService.getDashboardStats();
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

  // GET: lightweight counts endpoint for OAS staff (total + per-status)
  async getApplicationCounts(req, res) {
    try {
      // Aggregate counts by status in a single query (normalize casing)
      const stats = await ApplicationForm.aggregate([
        { $group: { _id: { $toLower: { $ifNull: ['$status', 'pending'] } }, count: { $sum: 1 } } }
      ]);

      // Build a normalized map including expected statuses
      const statuses = {
        pending: 0,
        form_verified: 0,
        document_verification: 0,
        interview_scheduled: 0,
        approved: 0,
        rejected: 0,
        unknown: 0
      };

      let total = 0;
      (stats || []).forEach(s => {
        const key = s._id || 'unknown';
        if (Object.prototype.hasOwnProperty.call(statuses, key)) {
          statuses[key] = s.count;
        } else {
          // accumulate unexpected statuses into 'unknown'
          statuses.unknown += s.count;
        }
        total += s.count;
      });

      res.json({
        success: true,
        data: {
          totalApplicants: total,
          counts: statuses
        }
      });
    } catch (error) {
      console.error('❌ Backend: Error getting application counts:', error);
      res.status(500).json({ success: false, message: 'Failed to get application counts', error: error.message });
    }
  },

  // GET: Get analytics for OAS staff (applications overview, GPA, income, program breakdowns)
  async getAnalytics(req, res) {
    try {
      console.log('✅ Backend: Getting analytics for OAS...');

        // Use a facet aggregation to compute multiple metrics in a single query
      const results = await ApplicationForm.aggregate([
        // Join with users to pick up gender from the user record if application.gender is missing
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDoc'
          }
        },
        { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
        // Project only fields we need
        {
          $project: {
            status: 1,
            program: '$programOfStudyAndYear',
            annualFamilyIncome: 1,
            collegeLevel: '$education.collegeLevel',
            // Use application.gender first, then user's gender, then null
            normalizedGender: {
              $cond: [
                { $in: [ { $toLower: { $ifNull: ['$gender', '$userDoc.gender'] } }, ['male', 'female'] ] },
                { $ifNull: ['$gender', '$userDoc.gender'] },
                'Unknown'
              ]
            }
          }
        },
        {
          $facet: {
            totalApplicants: [ { $count: 'count' } ],

            statusCounts: [
              // normalize status casing to lowercase
              { $group: { _id: { $toLower: { $ifNull: ['$status', 'pending'] } }, count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],

            programCounts: [
              { $group: { _id: '$program', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],

            incomeCounts: [
              { $group: { _id: '$annualFamilyIncome', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            genderCounts: [
              { $group: { _id: '$normalizedGender', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],

            // Compute applicant-level GPA averages
            gpaStats: [
              // Compute per-applicant average from collegeLevel entries
              {
                $project: {
                  perEntryAvg: {
                    $map: {
                      input: { $ifNull: ['$collegeLevel', []] },
                      as: 'cl',
                      in: {
                        $let: {
                          vars: {
                            sum: {
                              $add: [
                                { $ifNull: ['$$cl.firstSemesterAverageFinalGrade', null] },
                                { $ifNull: ['$$cl.secondSemesterAverageFinalGrade', null] },
                                { $ifNull: ['$$cl.thirdSemesterAverageFinalGrade', null] }
                              ]
                            },
                            cnt: {
                              $add: [
                                { $cond: [{ $ifNull: ['$$cl.firstSemesterAverageFinalGrade', false] }, 1, 0] },
                                { $cond: [{ $ifNull: ['$$cl.secondSemesterAverageFinalGrade', false] }, 1, 0] },
                                { $cond: [{ $ifNull: ['$$cl.thirdSemesterAverageFinalGrade', false] }, 1, 0] }
                              ]
                            }
                          },
                          in: {
                            $cond: [{ $gt: ['$$cnt', 0] }, { $divide: ['$$sum', '$$cnt'] }, null]
                          }
                        }
                      }
                    }
                  }
                }
              },
              // compute applicant average across entries
              {
                $addFields: {
                  applicantAvg: { $avg: '$perEntryAvg' }
                }
              },
              { $match: { applicantAvg: { $ne: null } } },
              {
                $group: {
                  _id: null,
                  avgGPA: { $avg: '$applicantAvg' },
                  gpaList: { $push: '$applicantAvg' },
                  count: { $sum: 1 }
                }
              }
            ],

            // For GPA distribution using explicit buckets (ranges)
            gpaBuckets: [
              // Recompute per-applicant avg then bucket
              {
                $project: {
                  applicantAvg: {
                    $let: {
                      vars: {
                        perEntryAvg: {
                          $map: {
                            input: { $ifNull: ['$collegeLevel', []] },
                            as: 'cl',
                            in: {
                              $let: {
                                vars: {
                                  sum: {
                                    $add: [
                                      { $ifNull: ['$$cl.firstSemesterAverageFinalGrade', null] },
                                      { $ifNull: ['$$cl.secondSemesterAverageFinalGrade', null] },
                                      { $ifNull: ['$$cl.thirdSemesterAverageFinalGrade', null] }
                                    ]
                                  },
                                  cnt: {
                                    $add: [
                                      { $cond: [{ $ifNull: ['$$cl.firstSemesterAverageFinalGrade', false] }, 1, 0] },
                                      { $cond: [{ $ifNull: ['$$cl.secondSemesterAverageFinalGrade', false] }, 1, 0] },
                                      { $cond: [{ $ifNull: ['$$cl.thirdSemesterAverageFinalGrade', false] }, 1, 0] }
                                    ]
                                  }
                                },
                                in: { $cond: [{ $gt: ['$$cnt', 0] }, { $divide: ['$$sum', '$$cnt'] }, null] }
                              }
                            }
                          }
                        }
                      },
                      in: { $avg: '$$perEntryAvg' }
                    }
                  }
                }
              },
              { $match: { applicantAvg: { $ne: null } } },
              {
                $bucket: {
                  groupBy: '$applicantAvg',
                  boundaries: [0, 1.6, 2.1, 2.6, 3.1, 3.6, 4.1, 100],
                  default: 'Other',
                  output: { count: { $sum: 1 } }
                }
              }
            ]
          }
        }
      ]).allowDiskUse(true);

      const facet = (results && results[0]) || {};

      const totalApplicants = (facet.totalApplicants && facet.totalApplicants[0] && facet.totalApplicants[0].count) || 0;

      const statusCounts = {};
      (facet.statusCounts || []).forEach(s => { statusCounts[s._id || 'unknown'] = s.count; });

      const programs = (facet.programCounts || []).map(p => ({ program: p._id || 'Unknown', count: p.count }));

      const incomeCounts = {};
      (facet.incomeCounts || []).forEach(i => { incomeCounts[i._id || 'Unknown'] = i.count; });

  const genderCounts = {};
  (facet.genderCounts || []).forEach(g => { genderCounts[g._id || 'Prefer not to say'] = g.count; });

      const avgGPA = (facet.gpaStats && facet.gpaStats[0] && facet.gpaStats[0].avgGPA) ? Number((facet.gpaStats[0].avgGPA).toFixed(2)) : null;
      const gpaCount = (facet.gpaStats && facet.gpaStats[0] && facet.gpaStats[0].count) || 0;

      // Format GPA buckets with human readable labels
      const bucketLabels = [
        '≤ 1.5',
        '1.6 - 2.0',
        '2.1 - 2.5',
        '2.6 - 3.0',
        '3.1 - 3.5',
        '3.6 - 4.0',
        '4.1+'
      ];

      const rawBuckets = facet.gpaBuckets || [];
      const gpaDistribution = rawBuckets.map((b, idx) => ({
        range: bucketLabels[idx] || String(b._id),
        count: b.count || 0
      }));

      res.json({
        success: true,
        data: {
          totalApplicants,
          statusCounts,
          programs,
          averageGPA: avgGPA,
          gpaCount,
          gpaDistribution,
          incomeCounts,
          genderCounts
        }
      });
    } catch (error) {
      console.error('❌ Backend: Error getting analytics:', error);
      res.status(500).json({ success: false, message: 'Failed to get analytics', error: error.message });
    }
  },

  // PUT: Set status for a specific application by ID (for OAS staff)
  async setStatusById(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await ApplicationService.setStatusById(id, status, req.user.id);

      res.json({
        message: 'Status updated successfully',
        application: result
      });
    } catch (error) {
      console.error('Error in setStatusById:', error);
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update status: ${error.message}` });
    }
  },

  // PATCH /application/auto-complete - Auto-complete application when personality test is detected
  async autoCompleteApplication(req, res) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      const result = await ApplicationService.autoCompleteApplication(userId, reason);

      res.json(result);

    } catch (error) {
      console.error('Error in autoCompleteApplication:', error);
      if (error.message.includes('not found') || error.message.includes('Cannot auto-complete')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // Soft delete an application
  async softDeleteApplication(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.softDeleteApplication(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in softDeleteApplication:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Restore a soft-deleted application
  async restoreApplication(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.restoreApplication(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in restoreApplication:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Permanently delete an application
  async permanentDeleteApplication(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.permanentDeleteApplication(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in permanentDeleteApplication:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get soft-deleted applications
  async getSoftDeletedApplications(req, res) {
    try {
      const result = await ApplicationService.getSoftDeletedApplications(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getSoftDeletedApplications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = ApplicationController;