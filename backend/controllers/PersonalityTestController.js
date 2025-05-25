const mongoose = require('mongoose');
const PersonalityTest = require('../models/PersonalityTest');
const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
const PersonalityAssessmentTemplate = require('../models/PersonalityTestTemplate');
const ApplicationForm = require('../models/ApplicationForm');

const PersonalityTestController = {
  // POST /startPersonalityTest
  async startPersonalityTest(req, res) {
    try {
      const userId = req.user.id;

      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Check for existing incomplete test
      const existingTest = await PersonalityTest.findOne({ applicationId: application._id, endTime: {$exists: false} } );
      if (existingTest) {
        return res.status(409).json({ message: 'An active personality test already exists' });
      }

      // Check for completed test
      const completedTest = await PersonalityTest.findOne({
        'answers': { $elemMatch: { applicationId: application._id } },
        endTime: { $exists: true },
      });
      if (completedTest) {
        return res.status(403).json({ message: 'User has already completed a personality test' });
      }

      // Get distinct categories from PersonalityAssessmentTemplate
      const categories = await PersonalityAssessmentTemplate.distinct('type');
      if (categories.length === 0) {
        return res.status(404).json({ message: 'No questions available in template' });
      }

      // Pick one random question per category
      const questions = [];
      for (const category of categories) {
        const question = await PersonalityAssessmentTemplate.aggregate([
          { $match: { type: category } },
          { $sample: { size: 1 } },
        ]);
        if (question[0]) {
          questions.push(question[0]);
        }
      }

      if (questions.length === 0) {
        return res.status(404).json({ message: 'No questions found for categories' });
      }

      // Create test
      const startTime = new Date();
      const test = new PersonalityTest({
        answers: [],
        startTime,
        endTime: null,
        timeLimitSeconds: 900, // 15 minutes
      });
      await test.save();

      // Return questions
      res.status(201).json({
        testId: test._id,
        startTime,
        timeLimitSeconds: test.timeLimitSeconds,
        questions: questions.map(q => ({
          _id: q._id,
          type: q.type,
          question: q.question,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // POST /answerPersonalityTest
  async answerPersonalityTest(req, res) {
    try {
      const userId = req.user.id;
      const { testId, questionId, answer } = req.body;

      // Validate input
      if (!testId || !questionId || !answer) {
        return res.status(400).json({ message: 'testId, questionId, and answer are required' });
      }

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find test
      const test = await PersonalityTest.findById(testId);
      if (!test) {
        return res.status(404).json({ message: 'Personality test not found' });
      }

      // Check if test is active
      const currentTime = new Date();
      const deadline = new Date(test.startTime.getTime() + test.timeLimitSeconds * 1000);
      if (test.endTime || currentTime > deadline) {
        test.endTime = test.endTime || currentTime;
        await test.save();
        return res.status(403).json({ message: 'Test is already completed or past deadline' });
      }

      // Validate question
      const question = await PersonalityAssessmentTemplate.findById(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      // Check for existing answer
      const existingAnswer = await PersonalityAssessmentAnswers.findOne({
        applicationId: application._id,
        questionId,
      });
      if (existingAnswer) {
        return res.status(409).json({ message: 'Question already answered' });
      }

      // Save answer
      const answerDoc = new PersonalityAssessmentAnswers({
        applicationId: application._id,
        questionId,
        answer,
      });
      await answerDoc.save();

      // Update test
      test.answers.push(answerDoc._id);
      await test.save();

      res.status(201).json({ message: 'Answer submitted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /stopPersonalityTest
  async stopPersonalityTest(req, res) {
    try {
      const userId = req.user.id;

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find active test
      const test = await PersonalityTest.findOne({
        'answers': { $elemMatch: { applicationId: application._id } },
        endTime: { $exists: false },
      });
      if (!test) {
        return res.status(404).json({ message: 'No active personality test found' });
      }

      // Stop test
      test.endTime = new Date();
      await test.save();

      res.json({ message: 'Personality test stopped', testId: test._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /getMyPersonalityTest
  async getMyPersonalityTest(req, res) {
    try {
      const userId = req.user.id;

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find test
      const test = await PersonalityTest.findOne({
        'answers': { $elemMatch: { applicationId: application._id } },
      })
        .populate({
          path: 'answers',
          populate: [
            { path: 'questionId', select: 'type question' },
            { path: 'applicationId', select: '_id' },
          ],
        });

      if (!test) {
        return res.status(404).json({ message: 'No personality test found' });
      }

      // Check deadline
      if (!test.endTime) {
        const currentTime = new Date();
        const deadline = new Date(test.startTime.getTime() + test.timeLimitSeconds * 1000);
        if (currentTime > deadline) {
          test.endTime = currentTime;
          await test.save();
        }
      }

      res.json(test);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /getAllUserPersonalityTest
  async getAllUserPersonalityTest(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 25);
      const skip = (page - 1) * limit;

      const filter = {};
      const queryFields = req.query;

      // Handle filters
      for (const key in queryFields) {
        if (key !== 'page' && key !== 'limit') {
          if (mongoose.Types.ObjectId.isValid(queryFields[key])) {
            filter[key] = queryFields[key];
          } else {
            filter[key] = new RegExp(queryFields[key], 'i');
          }
        }
      }

      const tests = await PersonalityTest.find(filter)
        .populate({
          path: 'answers',
          populate: [
            { path: 'questionId', select: 'type question' },
            { path: 'applicationId', select: 'user' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PersonalityTest.countDocuments(filter);

      res.json({
        tests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /getPersonalityTestByUserId
  async getPersonalityTestByUserId(req, res) {
    try {
      const { userId } = req.params;

      // Find application for user
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find test
      const test = await PersonalityTest.findOne({
        'answers': { $elemMatch: { applicationId: application._id } },
      })
        .populate({
          path: 'answers',
          populate: [
            { path: 'questionId', select: 'type question' },
            { path: 'applicationId', select: 'user' },
          ],
        });

      if (!test) {
        return res.status(404).json({ message: 'No personality test found for user' });
      }

      res.json(test);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE /deletePersonalityTestByUserId
  async deletePersonalityTestByUserId(req, res) {
    try {
      const { userId } = req.params;

      // Find application for user
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find test
      const test = await PersonalityTest.findOne({
        'answers': { $elemMatch: { applicationId: application._id } },
      });
      if (!test) {
        return res.status(404).json({ message: 'No personality test found for user' });
      }

      // Delete answers
      await PersonalityAssessmentAnswers.deleteMany({ applicationId: application._id });

      // Delete test
      await PersonalityTest.deleteOne({ _id: test._id });

      res.json({ message: 'Personality test deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // CRUD for PersonalityAssessmentTemplate

  // POST /template
  async createTemplate(req, res) {
    try {
      const { type, question } = req.body;
      if (!type || !question) {
        return res.status(400).json({ message: 'type and question are required' });
      }

      const template = new PersonalityAssessmentTemplate({
        type,
        question,
        createdBy: req.user.id,
      });
      await template.save();

      res.status(201).json(template);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /template
  async getAllTemplates(req, res) {
    try {
      const templates = await PersonalityAssessmentTemplate.find()
        .populate('createdBy', 'name _id')
        .sort({ createdAt: -1 });
      res.json(templates);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /template/:id
  async getTemplateById(req, res) {
    try {
      const template = await PersonalityAssessmentTemplate.findById(req.params.id)
        .populate('createdBy', 'name _id');
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // PATCH /template/:id
  async updateTemplate(req, res) {
    try {
      const { type, question } = req.body;
      const template = await PersonalityAssessmentTemplate.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Check ownership or admin
      const user = await require('../models/User').findById(req.user.id);
      if (template.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this template' });
      }

      if (type) template.type = type;
      if (question) template.question = question;
      await template.save();

      res.json(template);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE /template/:id
  async deleteTemplate(req, res) {
    try {
      const template = await PersonalityAssessmentTemplate.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Check ownership or admin
      const user = await require('../models/User').findById(req.user.id);
      if (template.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this template' });
      }

      await PersonalityAssessmentTemplate.deleteOne({ _id: req.params.id });
      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = PersonalityTestController;