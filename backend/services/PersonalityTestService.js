const mongoose = require('mongoose');
const PersonalityTest = require('../models/PersonalityTest');
const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
const PersonalityAssessmentTemplate = require('../models/PersonalityTestTemplate');
const ApplicationForm = require('../models/ApplicationForm');
const ActivityLogger = require('./ActivityLogger');
const NotificationService = require('./NotificationService');

class PersonalityTestService {
  // Start a personality test
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

    // Create the personality test
    const personalityTest = new PersonalityTest({
      applicationId: application._id,
      questions: questions.map(q => ({
        questionId: q._id,
        type: q.type,
        text: q.text,
        options: q.options
      }))
    });

    await personalityTest.save();

    // Log activity
    await ActivityLogger.logPersonalityTest(
      userId,
      application._id,
      'personality_test_started',
      { testId: personalityTest._id }
    );

    // Create notification
    await NotificationService.createPersonalityTestNotification(
      userId,
      application._id,
      'started'
    );

    return {
      testId: personalityTest._id,
      questions: personalityTest.questions,
      message: 'Personality test started successfully'
    };
  }

  // Answer a personality test question
  static async answerPersonalityTest(userId, { testId, questionId, selectedOption }) {
    if (!testId || !questionId || selectedOption === undefined) {
      throw new Error('testId, questionId, and selectedOption are required');
    }

    // Find the personality test
    const test = await PersonalityTest.findById(testId);
    if (!test) {
      throw new Error('Personality test not found');
    }

    // Verify ownership
    const application = await ApplicationForm.findById(test.applicationId);
    if (!application || application.user.toString() !== userId) {
      throw new Error('Unauthorized access to personality test');
    }

    // Check if test is already completed
    if (test.status === 'completed') {
      throw new Error('Test is already completed');
    }

    // Find the question
    const question = test.questions.find(q => q.questionId.toString() === questionId);
    if (!question) {
      throw new Error('Question not found in test');
    }

    // Check if question already answered
    if (question.answer !== undefined) {
      throw new Error('Question has already been answered');
    }

    // Validate selected option
    if (selectedOption < 0 || selectedOption >= question.options.length) {
      throw new Error('Invalid selected option');
    }

    // Save the answer
    question.answer = selectedOption;
    await test.save();

    // Check if all questions are answered
    const allAnswered = test.questions.every(q => q.answer !== undefined);
    
    if (allAnswered) {
      // Calculate score
      const totalScore = test.questions.reduce((sum, q) => sum + q.answer, 0);
      test.totalScore = totalScore;
      test.status = 'completed';
      test.completedAt = new Date();
      await test.save();

      // Log completion
      await ActivityLogger.logPersonalityTest(
        userId,
        test.applicationId,
        'personality_test_completed',
        { testId: test._id, score: totalScore }
      );

      // Create completion notification
      await NotificationService.createPersonalityTestNotification(
        userId,
        test.applicationId,
        'completed'
      );

      return {
        message: 'Test completed successfully!',
        totalScore: totalScore,
        status: 'completed',
        completedAt: test.completedAt
      };
    }

    return {
      message: 'Answer saved successfully',
      answeredQuestions: test.questions.filter(q => q.answer !== undefined).length,
      totalQuestions: test.questions.length
    };
  }

  // Stop a personality test
  static async stopPersonalityTest(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const test = await PersonalityTest.findOne({
      applicationId: application._id,
      status: { $ne: 'completed' }
    });

    if (!test) {
      throw new Error('No active personality test found');
    }

    // Mark as stopped/cancelled
    test.status = 'stopped';
    test.stoppedAt = new Date();
    await test.save();

    // Log activity
    await ActivityLogger.logPersonalityTest(
      userId,
      application._id,
      'personality_test_stopped',
      { testId: test._id }
    );

    return { message: 'Personality test stopped successfully' };
  }

  // Get user's personality test
  static async getMyPersonalityTest(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const test = await PersonalityTest.findOne({
      applicationId: application._id,
    });

    if (!test) {
      throw new Error('No personality test found for user');
    }

    return test;
  }

  // Get all user personality tests (admin)
  static async getAllUserPersonalityTests() {
    const tests = await PersonalityTest.find({})
      .populate({
        path: 'applicationId',
        populate: {
          path: 'user',
          select: 'name email idNumber'
        }
      })
      .sort({ createdAt: -1 });

    return tests;
  }

  // Get personality test by user ID (admin)
  static async getPersonalityTestByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const test = await PersonalityTest.findOne({
      applicationId: application._id,
    }).populate({
      path: 'applicationId',
      populate: {
        path: 'user',
        select: 'name email idNumber'
      }
    });

    if (!test) {
      throw new Error('No personality test found for user');
    }

    return test;
  }

  // Check personality test status
  static async getPersonalityTestStatus(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const test = await PersonalityTest.findOne({
      applicationId: application._id,
    });

    if (!test) {
      return {
        hasTest: false,
        status: 'not_started',
        message: 'No personality test found'
      };
    }

    return {
      hasTest: true,
      status: test.status,
      testId: test._id,
      totalScore: test.totalScore,
      completedAt: test.completedAt,
      questions: test.questions,
      message: `Personality test ${test.status}`
    };
  }

  // Delete personality test by user ID (admin)
  static async deletePersonalityTestByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for user');
    }

    const test = await PersonalityTest.findOne({
      applicationId: application._id,
    });

    if (!test) {
      throw new Error('No personality test found for user');
    }

    await PersonalityTest.findByIdAndDelete(test._id);

    return { message: 'Personality test deleted successfully' };
  }

  // Get personality test statistics
  static async getPersonalityTestStatistics() {
    const totalTests = await PersonalityTest.countDocuments();
    const completedTests = await PersonalityTest.countDocuments({ status: 'completed' });
    const averageScore = await PersonalityTest.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$totalScore' } } }
    ]);

    const scoreDistribution = await PersonalityTest.aggregate([
      { $match: { status: 'completed' } },
      {
        $bucket: {
          groupBy: '$totalScore',
          boundaries: [0, 10, 20, 30, 40, 50, 100],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    return {
      totalTests,
      completedTests,
      completionRate: totalTests > 0 ? ((completedTests / totalTests) * 100).toFixed(2) : 0,
      averageScore: averageScore[0]?.avg || 0,
      scoreDistribution
    };
  }

  // Check if user can take personality test
  static async canUserTakeTest(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      return { canTake: false, reason: 'No application found' };
    }

    // Check application status
    if (application.status !== 'document_verification') {
      return { 
        canTake: false, 
        reason: 'Application must be in document verification stage' 
      };
    }

    // Check if test already exists
    const existingTest = await PersonalityTest.findOne({
      applicationId: application._id,
    });

    if (existingTest) {
      return { 
        canTake: false, 
        reason: 'User has already taken a personality test',
        testStatus: existingTest.status
      };
    }

    return { canTake: true };
  }
}

module.exports = PersonalityTestService;