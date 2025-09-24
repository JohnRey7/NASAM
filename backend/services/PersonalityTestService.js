const mongoose = require('mongoose');
const PersonalityTest = require('../models/PersonalityTest');
const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
const PersonalityAssessmentTemplate = require('../models/PersonalityTestTemplate');
const ApplicationForm = require('../models/ApplicationForm');
const ActivityLogger = require('./ActivityLogger');
const NotificationService = require('./NotificationService');

class PersonalityTestService {
  // Start personality test for user
  static async startPersonalityTest(userId) {
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

    // Create personality test with selected questions
    const personalityTest = new PersonalityTest({
      applicationId: application._id,
      questionsAndAnswers: questions.map(q => ({
        questionId: q._id,
        questionText: q.question,
        type: q.type,
        answer: null,
        isAnswered: false,
      })),
      status: 'in_progress',
      startedAt: new Date(),
    });

    await personalityTest.save();

    return {
      message: 'Personality test started',
      testId: personalityTest._id,
      totalQuestions: questions.length,
      questions: personalityTest.questionsAndAnswers,
    };
  }

  // Submit answer for personality test
  static async submitAnswer(userId, testId, questionId, answer) {
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      throw new Error('Invalid test ID');
    }
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new Error('Invalid question ID');
    }
    if (typeof answer !== 'number' || answer < 1 || answer > 5) {
      throw new Error('Answer must be a number between 1 and 5');
    }

    // Find user's application
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    // Find the personality test
    const test = await PersonalityTest.findOne({
      _id: testId,
      applicationId: application._id,
    });
    if (!test) {
      throw new Error('Test not found or does not belong to user');
    }

    if (test.status === 'completed') {
      throw new Error('Test has already been completed');
    }
    if (test.status === 'paused') {
      throw new Error('Test is paused. Please resume or restart');
    }

    // Find the question in the test
    const questionIndex = test.questionsAndAnswers.findIndex(
      qa => qa.questionId.toString() === questionId
    );
    if (questionIndex === -1) {
      throw new Error('Question not found in test');
    }

    const question = test.questionsAndAnswers[questionIndex];
    if (question.isAnswered) {
      throw new Error('Question has already been answered');
    }

    // Update the question with answer
    test.questionsAndAnswers[questionIndex].answer = answer;
    test.questionsAndAnswers[questionIndex].isAnswered = true;

    // Check if all questions are answered
    const allAnswered = test.questionsAndAnswers.every(qa => qa.isAnswered);
    if (allAnswered) {
      test.status = 'completed';
      test.completedAt = new Date();
      
      // Create PersonalityAssessmentAnswers entry
      const answerEntry = new PersonalityAssessmentAnswers({
        applicationId: application._id,
        answers: test.questionsAndAnswers.map(qa => ({
          questionId: qa.questionId,
          questionText: qa.questionText,
          type: qa.type,
          answer: qa.answer,
        })),
        completedAt: new Date(),
      });
      
      await answerEntry.save();
      
      // Log activity
      await ActivityLogger.logPersonalityTestCompletion(userId, application._id);
      
      // Create notification
      await NotificationService.createPersonalityTestCompletedNotification(
        userId,
        application._id
      );
    }

    await test.save();

    const totalQuestions = test.questionsAndAnswers.length;
    const answeredQuestions = test.questionsAndAnswers.filter(qa => qa.isAnswered).length;

    return {
      message: allAnswered ? 'Test completed successfully' : 'Answer submitted',
      testStatus: test.status,
      progress: {
        answered: answeredQuestions,
        total: totalQuestions,
        percentage: Math.round((answeredQuestions / totalQuestions) * 100),
      },
      isCompleted: allAnswered,
    };
  }

  // Get personality test for user
  static async getPersonalityTest(userId) {
    // Find user's application
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    // Find the personality test
    const test = await PersonalityTest.findOne({
      applicationId: application._id,
    });

    if (!test) {
      throw new Error('No personality test found for user');
    }

    const totalQuestions = test.questionsAndAnswers.length;
    const answeredQuestions = test.questionsAndAnswers.filter(qa => qa.isAnswered).length;

    return {
      testId: test._id,
      status: test.status,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
      progress: {
        answered: answeredQuestions,
        total: totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      },
      questions: test.questionsAndAnswers,
    };
  }

  // Get all personality tests (admin)
  static async getAllPersonalityTests(options = {}) {
    const { page = 1, limit = 10, status } = options;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const query = {};
    if (status && ['in_progress', 'completed', 'paused'].includes(status)) {
      query.status = status;
    }

    const tests = await PersonalityTest.find(query)
      .populate({
        path: 'applicationId',
        populate: {
          path: 'user',
          select: 'name email idNumber',
        },
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await PersonalityTest.countDocuments(query);

    return {
      tests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Delete personality test
  static async deletePersonalityTest(userId) {
    // Find user's application
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const test = await PersonalityTest.findOneAndDelete({
      applicationId: application._id,
    });

    if (!test) {
      throw new Error('No personality test found for user');
    }

    // Also delete corresponding PersonalityAssessmentAnswers
    await PersonalityAssessmentAnswers.deleteOne({
      applicationId: application._id,
    });

    return { message: 'Personality test deleted successfully' };
  }

  // Template management methods
  static async createTemplate(templateData) {
    const { question, type } = templateData;

    if (!question || !type) {
      throw new Error('Question and type are required');
    }

    const validTypes = ['Extroversion', 'Agreeableness', 'Conscientiousness', 'Neuroticism', 'Openness'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid personality type');
    }

    const template = new PersonalityAssessmentTemplate({
      question,
      type,
    });

    await template.save();

    return {
      message: 'Template created successfully',
      template,
    };
  }

  static async getAllTemplates(options = {}) {
    const { page = 1, limit = 10, type } = options;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const query = {};
    if (type) {
      query.type = type;
    }

    const templates = await PersonalityAssessmentTemplate.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await PersonalityAssessmentTemplate.countDocuments(query);

    return {
      templates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async getTemplateById(templateId) {
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new Error('Invalid template ID');
    }

    const template = await PersonalityAssessmentTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return { template };
  }

  static async updateTemplate(templateId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new Error('Invalid template ID');
    }

    const { question, type } = updateData;

    if (type) {
      const validTypes = ['Extroversion', 'Agreeableness', 'Conscientiousness', 'Neuroticism', 'Openness'];
      if (!validTypes.includes(type)) {
        throw new Error('Invalid personality type');
      }
    }

    const template = await PersonalityAssessmentTemplate.findByIdAndUpdate(
      templateId,
      { question, type },
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      message: 'Template updated successfully',
      template,
    };
  }

  static async deleteTemplate(templateId) {
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new Error('Invalid template ID');
    }

    const template = await PersonalityAssessmentTemplate.findByIdAndDelete(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return { message: 'Template deleted successfully' };
  }

  // Get test results/answers
  static async getTestResults(userId) {
    // Find user's application
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const results = await PersonalityAssessmentAnswers.findOne({
      applicationId: application._id,
    });

    if (!results) {
      throw new Error('No test results found for user');
    }

    return {
      results: results.answers,
      completedAt: results.completedAt,
    };
  }
}

module.exports = PersonalityTestService;