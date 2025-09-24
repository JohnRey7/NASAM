// Check index.js for method mismatches
const fs = require('fs');

const indexContent = fs.readFileSync('./index.js', 'utf8');
const lines = indexContent.split('\n');

const controllers = {
  ApplicationController: require('./controllers/ApplicationController'),
  DocumentController: require('./controllers/DocumentController'),
  RoleController: require('./controllers/RoleController'),
  EvaluationController: require('./controllers/EvaluationController'),
  PersonalityTestController: require('./controllers/PersonalityTestController'),
  DepartmentController: require('./controllers/DepartmentController'),
  InterviewController: require('./controllers/InterviewController'),
  NotificationController: require('./controllers/NotificationController'),
  AuthController: require('./controllers/AuthController')
};

const errors = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  // Look for controller method calls like ControllerName.methodName
  const methodCallMatch = line.match(/(ApplicationController|DocumentController|RoleController|EvaluationController|PersonalityTestController|DepartmentController|InterviewController|NotificationController|AuthController)\.(\w+)/);
  
  if (methodCallMatch) {
    const [, controllerName, methodName] = methodCallMatch;
    const controller = controllers[controllerName];
    
    if (controller && typeof controller[methodName] !== 'function') {
      errors.push({
        line: lineNum,
        controller: controllerName,
        method: methodName,
        code: line.trim()
      });
    }
  }
});

console.log('=== MISSING METHODS ===');
if (errors.length === 0) {
  console.log('✅ No missing methods found!');
} else {
  errors.forEach(error => {
    console.log(`❌ Line ${error.line}: ${error.controller}.${error.method} does not exist`);
    console.log(`   Code: ${error.code}`);
    console.log('');
  });
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total lines checked: ${lines.length}`);
console.log(`Errors found: ${errors.length}`);