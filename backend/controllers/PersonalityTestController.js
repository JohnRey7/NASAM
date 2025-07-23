const mongoose = require('mongoose');
const PersonalityTest = require('../models/PersonalityTest');
const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
const PersonalityAssessmentTemplate = require('../models/PersonalityTestTemplate');
const ApplicationForm = require('../models/ApplicationForm');
const ActivityLogger = require('../services/ActivityLogger');
const NotificationService = require('../services/NotificationService');

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

      // Check if user has ever taken a test
      const existingTest = await PersonalityTest.findOne({
        applicationId: application._id,
      });
      if (existingTest) {
        return res.status(403).json({ 
          message: 'User has already taken a personality test and cannot take another' 
        });
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

      // Create test with start and end time
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 900 * 1000); // 15 minutes from start
      const test = new PersonalityTest({
        applicationId: application._id,
        questions: questions.map(q => q._id), // Save question IDs
        answers: [],
        startTime,
        endTime,
        timeLimitSeconds: 900, // 15 minutes
      });
      await test.save();

      // Populate questions for response
      const populatedTest = await PersonalityTest.findById(test._id)
        .populate('questions', 'type question');

      // Log the personality test start activity
      const userApplication = await ApplicationForm.findOne({ user: req.user.id });
      await ActivityLogger.logPersonalityTest(
        req.user.id,
        userApplication?._id,
        'personality_test_started'
      );

      // Return questions
      res.status(201).json({
        testId: test._id,
        startTime,
        endTime,
        timeLimitSeconds: test.timeLimitSeconds,
        questions: populatedTest.questions.map(q => ({
          _id: q._id,
          type: q.type,
          question: q.question,
        })),
      });
    } catch (error) {
      console.error('Error in startPersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // POST /answerPersonalityTest
  async answerPersonalityTest(req, res) {
    try {
      const userId = req.user.id;
      const answers = req.body;

      // Validate input
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Answers must be a non-empty array' });
      }

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find active test
      const currentTime = new Date();
      const test = await PersonalityTest.findOne({
        applicationId: application._id,
        endTime: { $gt: currentTime },
      }).populate('questions');
      if (!test) {
        return res.status(404).json({ 
          message: 'No active personality test found or test time has expired' 
        });
      }

      let isTestCompleted = false;
      let finalScore = 0;
      let answeredQuestions = 0;

      // Process each answer
      for (const { questionId, answer } of answers) {
        if (!questionId || !answer) {
          return res.status(400).json({ 
            message: 'questionId and answer are required for each answer' 
          });
        }

        // Validate question is part of the test
        const questionExists = test.questions.some(q => q._id.toString() === questionId);
        if (!questionExists) {
          return res.status(400).json({ 
            message: `Question ${questionId} is not part of this test` 
          });
        }

        // Check for existing answer
        const existingAnswer = await PersonalityAssessmentAnswers.findOne({
          applicationId: application._id,
          questionId,
        });
        if (existingAnswer) {
          return res.status(409).json({ 
            message: `Question already answered: ${questionId}` 
          });
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

        // Calculate score and check if test is completed
        if (answer !== null && answer !== undefined) {
          answeredQuestions++;
          finalScore += parseFloat(answer); // Assuming answer is numeric for scoring
        }
      }

      await test.save();
      res.status(201).json({ message: 'Answers submitted successfully' });

      // Log the personality test completion activity if completed
      if (isTestCompleted) {
        const userApplication = await ApplicationForm.findOne({ user: req.user.id });
        await ActivityLogger.logPersonalityTest(
          req.user.id,
          userApplication?._id,
          'personality_test_completed',
          { 
            score: finalScore, 
            totalQuestions: answeredQuestions,
            completionDate: new Date()
          }
        );
      }
    } catch (error) {
      console.error('Error in answerPersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
      const currentTime = new Date();
      const test = await PersonalityTest.findOne({
        applicationId: application._id,
        endTime: { $gt: currentTime },
      }).populate({
        path: 'answers',
        select: 'answer',
      });
      if (!test) {
        return res.status(404).json({ message: 'No active personality test found' });
      }

      // Stop test by setting endTime to current time
      test.endTime = new Date();

      // Calculate score
      const answers = test.answers;
      const total = answers.reduce((sum, ans) => sum + Number(ans.answer), 0);
      const score = answers.length ? total / answers.length : 0;

      // Risk level rubric (example)
      let riskLevelIndicator = "Low";
      if (score < 2.5) riskLevelIndicator = "High";
      else if (score < 3.5) riskLevelIndicator = "Medium";

      test.score = score;
      test.riskLevelIndicator = riskLevelIndicator;
      await test.save();

      res.json({
        message: 'Personality test submitted',
        testId: test._id,
        score,
        riskLevelIndicator
      });
    } catch (error) {
      console.error('Error in stopPersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
        applicationId: application._id,
      })
        .populate({
          path: 'questions',
          select: 'type question',
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

      res.json(test);
    } catch (error) {
      console.error('Error in getMyPersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
          path: 'questions',
          select: 'type question',
        })
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
      console.error('Error in getAllUserPersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
        applicationId: application._id,
      })
        .populate({
          path: 'questions',
          select: 'type question',
        })
        .populate({
          path: 'answers',
          populate: [
            { path: 'questionId', select: 'type question' },
            { path: 'applicationId', select: 'user' },
          ],
        });

      if (!test) {
        return res.status(404).json({ message: 'No personality test found' });
      }

      res.json(test);
    } catch (error) {
      console.error('Error in getPersonalityTestByUserId:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // PATCH /updatePersonalityTest/:testId
  async updatePersonalityTest(req, res) {
    try {
      const { testId } = req.params;

      // Validate user authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      }
      const userId = req.user.id;

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: 'Request body is required' });
      }
      const { answers, score } = req.body;

      // Validate input
      if (!mongoose.Types.ObjectId.isValid(testId)) {
        return res.status(400).json({ message: 'Invalid test ID' });
      }
      if (answers && !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Answers must be an array' });
      }
      if (score !== undefined && (isNaN(score) || score < 0)) {
        return res.status(400).json({ message: 'Score must be a non-negative number' });
      }

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for user' });
      }

      // Find test
      const test = await PersonalityTest.findOne({
        _id: testId,
        applicationId: application._id,
      }).populate('questions');
      if (!test) {
        return res.status(404).json({ message: 'Personality test not found' });
      }

      // Update score if provided
      if (score !== undefined) {
        test.score = score; // Mongoose converts to Decimal128
      }

      // Process answers if provided and non-empty
      if (answers && answers.length > 0) {
        for (const { questionId, answer } of answers) {
          if (!questionId || !answer) {
            return res.status(400).json({ 
              message: 'questionId and answer are required for each answer' 
            });
          }

          // Validate question is part of the test
          const questionExists = test.questions.some(q => q._id.toString() === questionId);
          if (!questionExists) {
            return res.status(400).json({ 
              message: `Question ${questionId} is not part of this test` 
            });
          }

          // Check for existing answer
          let answerDoc = await PersonalityAssessmentAnswers.findOne({
            applicationId: application._id,
            questionId,
          });

          if (answerDoc) {
            // Update existing answer
            answerDoc.answer = answer;
            await answerDoc.save();
          } else {
            // Create new answer
            answerDoc = new PersonalityAssessmentAnswers({
              applicationId: application._id,
              questionId,
              answer,
            });
            await answerDoc.save();
            test.answers.push(answerDoc._id);
          }
        }
      }

      await test.save();

      // Fetch updated test with populated fields
      const updatedTest = await PersonalityTest.findById(test._id)
        .populate({
          path: 'questions',
          select: 'type question',
        })
        .populate({
          path: 'answers',
          populate: [
            { path: 'questionId', select: 'type question' },
            { path: 'applicationId', select: '_id' },
          ],
        });

      res.status(200).json(updatedTest);
    } catch (error) {
      console.error('Error in updatePersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
        applicationId: application._id,
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
      console.error('Error in deletePersonalityTestByUserId:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
      console.error('Error in createTemplate:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /template
  async getAllTemplates(req, res) {
    try {
      const templates = await PersonalityAssessmentTemplate.find()
        .populate('createdBy', 'firstName lastName _id')
        .sort({ createdAt: -1 });
      res.json(templates);
    } catch (error) {
      console.error('Error in getAllTemplates:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /template/:id
  async getTemplateById(req, res) {
    try {
      const template = await PersonalityAssessmentTemplate.findById(req.params.id)
        .populate('createdBy', 'firstName lastName _id');
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Error in getTemplateById:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
      const user = await require('../models/User').findById(req.user.id).populate('role');
      if (template.createdBy.toString() !== req.user.id && user.role.name !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this template' });
      }

      if (type) template.type = type;
      if (question) template.question = question;
      await template.save();

      res.json(template);
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
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
      const user = await require('../models/User').findById(req.user.id).populate('role');
      if (template.createdBy.toString() !== req.user.id && user.role.name !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this template' });
      }

      await PersonalityAssessmentTemplate.deleteOne({ _id: req.params.id });
      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },
};

module.exports = PersonalityTestController;