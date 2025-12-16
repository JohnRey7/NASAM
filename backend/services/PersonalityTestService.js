const mongoose = require('mongoose');
const PersonalityTest = require('../models/PersonalityTest');
const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
const PersonalityAssessmentTemplate = require('../models/PersonalityTestTemplate');
const ApplicationForm = require('../models/ApplicationForm');
const ApplicationHistory = require('../models/ApplicationHistory');
const User = require('../models/User');
const ActivityLogger = require('../services/ActivityLogger');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class PersonalityTestService {
  static async startPersonalityTest(userId) {
    try {
      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Check if user has ever taken a test
      const existingTest = await PersonalityTest.findOne({
        applicationId: application._id,
      });
      if (existingTest) {
        throw new Error('User has already taken a personality test and cannot take another');
      }

      // Get distinct categories from PersonalityAssessmentTemplate
      const categories = await PersonalityAssessmentTemplate.distinct('type');
      if (categories.length === 0) {
        throw new Error('No questions available in template');
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
        throw new Error('No questions found for categories');
      }

      // Create test with start and end time
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 300 * 1000); // 5 minutes from start
      const test = new PersonalityTest({
        applicationId: application._id,
        questions: questions.map(q => q._id), // Save question IDs
        answers: [],
        startTime,
        endTime,
        timeLimitSeconds: 300, // 5 minutes
      });
      await test.save();

      // Populate questions for response
      const populatedTest = await PersonalityTest.findById(test._id)
        .populate('questions', 'type question');

      // Log the personality test start activity
      const userApplication = await ApplicationForm.findOne({ user: userId });
      await ActivityLogger.logPersonalityTest(
        userId,
        userApplication?._id,
        'personality_test_started'
      );

      // Return questions
      return {
        testId: test._id,
        startTime,
        endTime,
        timeLimitSeconds: test.timeLimitSeconds,
        questions: populatedTest.questions.map(q => ({
          _id: q._id,
          type: q.type,
          question: q.question,
        })),
      };
    } catch (error) {
      console.error('Error starting personality test:', error);
      throw error;
    }
  }

  static async answerPersonalityTest(userId, answers) {
    try {
      // Validate input
      if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error('Answers must be a non-empty array');
      }

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Find active test
      const currentTime = new Date();
      const test = await PersonalityTest.findOne({
        applicationId: application._id,
        endTime: { $gt: currentTime },
      }).populate('questions');
      
      if (!test) {
        throw new Error('No active personality test found or test time has expired');
      }

      let isTestCompleted = false;
      let finalScore = 0;
      let answeredQuestions = 0;

      // Process each answer
      for (const { questionId, answer } of answers) {
        if (!questionId || !answer) {
          throw new Error('questionId and answer are required for each answer');
        }

        // Validate question is part of the test
        const questionExists = test.questions.some(q => q._id.toString() === questionId);
        if (!questionExists) {
          throw new Error(`Question ${questionId} is not part of this test`);
        }

        // Check for existing answer
        let answerDoc;
        let existingAnswer = await PersonalityAssessmentAnswers.findOne({
          applicationId: application._id,
          questionId,
        });
        
        if (existingAnswer) {
          // Update the answer
          existingAnswer.answer = answer;
          await existingAnswer.save();
          answerDoc = existingAnswer;
        } else {
          // Save new answer
          answerDoc = new PersonalityAssessmentAnswers({
            applicationId: application._id,
            questionId,
            answer,
          });
          await answerDoc.save();
          // Only push to test.answers if it's a new answer (not already in the array)
          if (!test.answers.includes(answerDoc._id)) {
            test.answers.push(answerDoc._id);
          }
        }

        // Calculate score and check if test is completed
        if (answer !== null && answer !== undefined) {
          answeredQuestions++;
          finalScore += parseFloat(answer); // Assuming answer is numeric for scoring
        }
      }

      await test.save();

      // Log the personality test completion activity if completed
      if (isTestCompleted) {
        const userApplication = await ApplicationForm.findOne({ user: userId });
        await ActivityLogger.logPersonalityTest(
          userId,
          userApplication?._id,
          'personality_test_completed',
          { 
            score: finalScore, 
            totalQuestions: answeredQuestions,
            completionDate: new Date()
          }
        );
      }

      return { message: 'Answers submitted successfully' };
    } catch (error) {
      console.error('Error answering personality test:', error);
      throw error;
    }
  }

  static async stopPersonalityTest(userId) {
    try {
      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
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
        throw new Error('No active personality test found');
      }

      // Stop test by setting endTime to current time
      test.endTime = new Date();

      // Calculate score
      const answers = test.answers;
      const total = answers.reduce((sum, ans) => sum + Number(ans.answer), 0);
      const score = answers.length ? total / answers.length : 0;

      // New risk level rubric based on score ranges
      let riskLevelIndicator = "Average";
      if (score < 2.0) {
        riskLevelIndicator = "Very Low";
      } else if (score < 2.5) {
        riskLevelIndicator = "Low";
      } else if (score < 3.0) {
        riskLevelIndicator = "Below Average";
      } else if (score < 4.0) {
        riskLevelIndicator = "Average";
      } else {
        riskLevelIndicator = "Above Average";
      }

      test.score = score;
      test.riskLevelIndicator = riskLevelIndicator;
      await test.save();

      // Auto-complete application when personality test is finished
      try {
        // Create history entry before updating
        const historyData = application.toObject();
        delete historyData._id;
        const historyEntry = new ApplicationHistory(historyData);
        await historyEntry.save();


        /**
         * Ww still need the interview and evaluation parts before approving
         * So commenting this out for now
         */
        
        // // Update application status to approved
        // await ApplicationForm.findByIdAndUpdate(
        //   application._id,
        //   { 
        //     status: 'approved',
        //     updatedAt: new Date(),
        //     personalityTestCompletedAt: new Date()
        //   },
        //   { new: true }
        // );
        
        console.log('Application auto-completed after personality test');
      } catch (updateError) {
        console.warn('Failed to auto-complete application:', updateError.message);
        // Don't fail the test submission if status update fails
      }

      return {
        message: 'Personality test completed',
        testId: test._id,
        score
        // Note: riskLevelIndicator is intentionally not returned to applicants
      };
    } catch (error) {
      console.error('Error stopping personality test:', error);
      throw error;
    }
  }

  static async getMyPersonalityTest(userId) {
    try {
      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Find test (exclude soft-deleted)
      const test = await PersonalityTest.findOne({
        applicationId: application._id,
        is_deleted: { $ne: true }
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
        throw new Error('No personality test found');
      }

      return test;
    } catch (error) {
      console.error('Error getting my personality test:', error);
      throw error;
    }
  }

  static async getAllUserPersonalityTest(queryParams) {
    try {
      const page = parseInt(queryParams.page) || 1;
      const limit = Math.min(parseInt(queryParams.limit) || 10, 25);
      const skip = (page - 1) * limit;

      // Start with soft delete filter
      const filter = { is_deleted: { $ne: true } };
      const queryFields = queryParams;

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
          path: 'applicationId',
          populate: { path: 'user', select: 'name email' }
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
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PersonalityTest.countDocuments(filter);

      return {
        tests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting all user personality tests:', error);
      throw error;
    }
  }

  static async getPersonalityTestByUserId(userId) {
    try {
      // Find application for user
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        const error = new Error('No application found for user');
        error.status = 404;
        throw error;
      }

      // Find test (exclude soft-deleted)
      const test = await PersonalityTest.findOne({
        applicationId: application._id,
        is_deleted: { $ne: true }
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
        const error = new Error('No personality test found');
        error.status = 404;
        throw error;
      }

      return test;
    } catch (error) {
      console.error('Error getting personality test by user ID:', error);
      throw error;
    }
  }

  static async updatePersonalityTest(testId, userId, updateData) {
    try {
      const { answers, score } = updateData;

      // Validate input
      if (!mongoose.Types.ObjectId.isValid(testId)) {
        throw new Error('Invalid test ID');
      }
      if (answers && !Array.isArray(answers)) {
        throw new Error('Answers must be an array');
      }
      if (score !== undefined && (isNaN(score) || score < 0)) {
        throw new Error('Score must be a non-negative number');
      }

      // Find application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Find test
      const test = await PersonalityTest.findOne({
        _id: testId,
        applicationId: application._id,
      }).populate('questions');
      
      if (!test) {
        throw new Error('Personality test not found');
      }

      // Update score if provided
      if (score !== undefined) {
        test.score = score; // Mongoose converts to Decimal128
      }

      // Process answers if provided and non-empty
      if (answers && answers.length > 0) {
        for (const { questionId, answer } of answers) {
          if (!questionId || !answer) {
            throw new Error('questionId and answer are required for each answer');
          }

          // Validate question is part of the test
          const questionExists = test.questions.some(q => q._id.toString() === questionId);
          if (!questionExists) {
            throw new Error(`Question ${questionId} is not part of this test`);
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

      return updatedTest;
    } catch (error) {
      console.error('Error updating personality test:', error);
      throw error;
    }
  }

  static async deletePersonalityTestByUserId(userId) {
    try {
      // Find application for user
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Find test
      const test = await PersonalityTest.findOne({
        applicationId: application._id,
      });
      
      if (!test) {
        throw new Error('No personality test found for user');
      }

      // Delete answers
      await PersonalityAssessmentAnswers.deleteMany({ applicationId: application._id });

      // Delete test
      await PersonalityTest.deleteOne({ _id: test._id });

      return { message: 'Personality test deleted successfully' };
    } catch (error) {
      console.error('Error deleting personality test by user ID:', error);
      throw error;
    }
  }

  // Mark personality test as reviewed by OAS staff
  static async markAsReviewed(userId, reviewedBy) {
    try {
      // Find application for user
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Find and update test
      const test = await PersonalityTest.findOneAndUpdate(
        { applicationId: application._id },
        {
          reviewed: true,
          reviewedAt: new Date(),
          reviewedBy: reviewedBy
        },
        { new: true }
      ).populate('reviewedBy', 'name email');
      
      if (!test) {
        throw new Error('No personality test found for user');
      }

      // Send notification to applicant
      try {
        const NotificationService = require('./NotificationService');
        await NotificationService.createPersonalityTestReviewedNotification(
          userId,
          application._id
        );
        console.log('✅ Personality test reviewed notification sent to applicant');
      } catch (notifError) {
        console.warn('⚠️ Failed to send personality test reviewed notification:', notifError.message);
      }

      return test;
    } catch (error) {
      console.error('Error marking personality test as reviewed:', error);
      throw error;
    }
  }

  // Revert personality test review status
  static async revertReview(userId) {
    try {
      // Find application for user
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Find and update test
      const test = await PersonalityTest.findOneAndUpdate(
        { applicationId: application._id },
        {
          reviewed: false,
          $unset: { reviewedAt: 1, reviewedBy: 1 }
        },
        { new: true }
      );
      
      if (!test) {
        throw new Error('No personality test found for user');
      }

      return test;
    } catch (error) {
      console.error('Error reverting personality test review:', error);
      throw error;
    }
  }

  static async createTemplate(templateData, userId) {
    try {
      const { type, question } = templateData;
      
      if (!type || !question) {
        throw new Error('type and question are required');
      }

      const template = new PersonalityAssessmentTemplate({
        type,
        question,
        createdBy: userId,
      });
      await template.save();

      return template;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  static async getAllTemplates() {
    try {
      const templates = await PersonalityAssessmentTemplate.find()
        .populate('createdBy', 'firstName lastName _id')
        .sort({ createdAt: -1 });
      
      return templates;
    } catch (error) {
      console.error('Error getting all templates:', error);
      throw error;
    }
  }

  static async getTemplateById(templateId) {
    try {
      const template = await PersonalityAssessmentTemplate.findById(templateId)
        .populate('createdBy', 'firstName lastName _id');
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      return template;
    } catch (error) {
      console.error('Error getting template by ID:', error);
      throw error;
    }
  }

  static async updateTemplate(templateId, updateData, userId) {
    try {
      const { type, question } = updateData;
      
      const template = await PersonalityAssessmentTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check ownership or admin
      const user = await User.findById(userId).populate('role');
      if (template.createdBy.toString() !== userId && user.role.name !== 'admin') {
        throw new Error('Not authorized to update this template');
      }

      if (type) template.type = type;
      if (question) template.question = question;
      await template.save();

      return template;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  static async deleteTemplate(templateId, userId) {
    try {
      const template = await PersonalityAssessmentTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check ownership or admin
      const user = await User.findById(userId).populate('role');
      if (template.createdBy.toString() !== userId && user.role.name !== 'admin') {
        throw new Error('Not authorized to delete this template');
      }

      await PersonalityAssessmentTemplate.deleteOne({ _id: templateId });
      
      return { message: 'Template deleted successfully' };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  static async checkPersonalityTestStatus(userId) {
    return PersonalityTestService.getPersonalityTestStatus(userId);
  }

  static async getPersonalityTestStatus(userId) {
    try {
      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for user');
      }

      // Check if user has ever taken a test (same logic as startPersonalityTest, exclude soft-deleted)
      const existingTest = await PersonalityTest.findOne({
        applicationId: application._id,
        is_deleted: { $ne: true }
      });

      if (existingTest) {
        // User has completed a personality test
        return {
          hasTest: true,
          testId: existingTest._id,
          completed: true,
          score: existingTest.score,
          riskLevel: existingTest.riskLevelIndicator
        };
      } else {
        // User has not taken a personality test
        return {
          hasTest: false,
          completed: false
        };
      }
    } catch (error) {
      console.error('Error getting personality test status:', error);
      throw error;
    }
  }

  static async getAllPersonalityTests() {
    try {
      // Find all personality tests with populated application data (exclude soft-deleted)
      const tests = await PersonalityTest.find({ is_deleted: { $ne: true } })
        .populate({
          path: 'applicationId',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        })
        .populate('questions', 'type question')
        .sort({ startTime: -1 });

      const formattedTests = tests.map(test => {
        const timeRemaining = Math.max(0, Math.floor((test.endTime - new Date()) / 1000));
        const hasExpired = new Date() > test.endTime;

        return {
          _id: test._id,
          applicationId: test.applicationId._id,
          applicant: {
            firstName: test.applicationId.user?.firstName || 'Unknown',
            lastName: test.applicationId.user?.lastName || 'User',
            email: test.applicationId.user?.email || 'unknown@email.com'
          },
          startTime: test.startTime,
          endTime: test.endTime,
          timeRemaining,
          hasExpired,
          timeLimitSeconds: test.timeLimitSeconds,
          totalQuestions: test.questions?.length || 0,
          score: test.score,
          riskLevelIndicator: test.riskLevelIndicator,
          questions: test.questions?.map(q => ({
            _id: q._id,
            type: q.type,
            question: q.question,
          })) || [],
        };
      });

      return formattedTests;
    } catch (error) {
      console.error('Error in getAllPersonalityTests:', error);
      throw error;
    }
  }

  static async getPersonalityAssessmentTemplates() {
    try {
      const templates = await PersonalityAssessmentTemplate.find({}).sort({ type: 1, createdAt: 1 });
      return templates;
    } catch (error) {
      console.error('Error in getPersonalityAssessmentTemplates:', error);
      throw error;
    }
  }

  // Soft Delete Methods
  static async softDeletePersonalityTest(testId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(PersonalityTest, testId);
      return { message: 'Personality test soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting personality test:', error);
      throw error;
    }
  }

  static async restorePersonalityTest(testId) {
    try {
      const result = await SoftDeleteUtils.restoreById(PersonalityTest, testId);
      return { message: 'Personality test restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring personality test:', error);
      throw error;
    }
  }

  static async permanentDeletePersonalityTest(testId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(PersonalityTest, testId);
      return { message: 'Personality test permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting personality test:', error);
      throw error;
    }
  }

  static async getSoftDeletedPersonalityTests(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(PersonalityTest, query);
    } catch (error) {
      console.error('Error getting soft deleted personality tests:', error);
      throw error;
    }
  }
}

module.exports = PersonalityTestService;