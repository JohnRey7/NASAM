const ApplicationForm = require('../models/ApplicationForm');

const ApplicationController = {
  // Create a new application form for the authenticated user
  async createApplicationForm(req, res) {
    try {
      const userId = req.user.id; // From authentication middleware
      const existingApplication = await ApplicationForm.findOne({ userId });
      if (existingApplication) {
        return res.status(409).json({ message: "User already filled an Application" });
      }
      const applicationData = { ...req.body, userId };
      const application = new ApplicationForm(applicationData);
      await application.save();
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Get the application form for the authenticated user
  async getMyApplicationForm(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationForm.findOne({ userId });
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
      const application = await ApplicationForm.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      if (application.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateMyApplicationForm(req, res) {
        try {
            const userId = req.user.id;
            const application = await ApplicationForm.findOne({ userId });
            if (!application) {
                return res.status(404).json({ message: 'Application not found' });
            }
            Object.assign(application, req.body);
            await application.save();
            res.json(application);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

  // Update a specific application form (for admins or owner)
  async updateApplicationForm(req, res) {
    try {
      const application = await ApplicationForm.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      if (application.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      Object.assign(application, req.body);
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
      await application.remove();
      res.json({ message: 'Application deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all application forms (admin only)
  async getAllApplicationForms(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const applications = await ApplicationForm.find();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = ApplicationController;