// Controller method checker
const path = require('path');

try {
  const ApplicationController = require('./controllers/ApplicationController');
  const DocumentController = require('./controllers/DocumentController');
  const RoleController = require('./controllers/RoleController');
  const EvaluationController = require('./controllers/EvaluationController');
  const PersonalityTestController = require('./controllers/PersonalityTestController');
  const DepartmentController = require('./controllers/DepartmentController');
  const InterviewController = require('./controllers/InterviewController');

  console.log('=== RoleController Methods ===');
  Object.keys(RoleController).forEach(key => console.log(`- ${key}: ${typeof RoleController[key]}`));

  console.log('\n=== ApplicationController Methods ===');
  Object.keys(ApplicationController).forEach(key => console.log(`- ${key}: ${typeof ApplicationController[key]}`));

  console.log('\n=== DocumentController Methods ===');
  Object.keys(DocumentController).forEach(key => console.log(`- ${key}: ${typeof DocumentController[key]}`));

  console.log('\n=== EvaluationController Methods ===');
  Object.keys(EvaluationController).forEach(key => console.log(`- ${key}: ${typeof EvaluationController[key]}`));

  console.log('\n=== PersonalityTestController Methods ===');
  Object.keys(PersonalityTestController).forEach(key => console.log(`- ${key}: ${typeof PersonalityTestController[key]}`));

  console.log('\n=== DepartmentController Methods ===');
  Object.keys(DepartmentController).forEach(key => console.log(`- ${key}: ${typeof DepartmentController[key]}`));

  console.log('\n=== InterviewController Methods ===');
  Object.keys(InterviewController).forEach(key => console.log(`- ${key}: ${typeof InterviewController[key]}`));

} catch (error) {
  console.error('Error loading controllers:', error);
}