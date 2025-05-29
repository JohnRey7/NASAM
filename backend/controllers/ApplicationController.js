const ApplicationForm = require('../models/ApplicationForm');
const User = require('../models/User');
const Role = require('../models/Role');
const mongoose = require('mongoose');

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

  // GET: Retrieve all users with their application status
  async getAllUsersWithApplicationStatus(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Find the applicant role
      const applicantRole = await Role.findOne({ name: 'applicant' });
      if (!applicantRole) {
        return res.status(404).json({ message: 'Applicant role not found' });
      }

      // Get all users with applicant role
      const query = { role: applicantRole._id };
      const users = await User.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('course')
        .sort({ createdAt: -1 });

      // Get their applications
      const userIds = users.map(user => user._id);
      const applications = await ApplicationForm.find({ user: { $in: userIds } });
      const applicationMap = applications.reduce((map, app) => {
        map[app.user.toString()] = app;
        return map;
      }, {});

      // Combine user and application data
      const combinedData = users.map(user => {
        const application = applicationMap[user._id.toString()];
        return {
          _id: application ? application._id : null,
          user: {
            _id: user._id,
            name: user.name,
            idNumber: user.idNumber,
          },
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' '),
          emailAddress: user.email,
          programOfStudyAndYear: user.course ? user.course.name : 'N/A',
          status: application ? application.status : 'Pending',
          createdAt: application ? application.createdAt : user.createdAt,
        };
      });

      // Filter by status if specified
      const filteredData = status 
        ? combinedData.filter(item => item.status === status)
        : combinedData;

      const totalDocs = await User.countDocuments(query);

      res.json({
        message: 'Users with application status retrieved successfully',
        applications: filteredData,
        pagination: {
          totalDocs,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(totalDocs / parseInt(limit)),
          hasNextPage: skip + users.length < totalDocs,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error in getAllUsersWithApplicationStatus:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = ApplicationController;