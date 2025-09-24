// Simple route validation test
const RoleController = require('./controllers/RoleController');
const ApplicationController = require('./controllers/ApplicationController');
const PersonalityTestController = require('./controllers/PersonalityTestController');
const InterviewController = require('./controllers/InterviewController');
const DocumentController = require('./controllers/DocumentController');
const DepartmentController = require('./controllers/DepartmentController');
const EvaluationController = require('./controllers/EvaluationController');

console.log('Testing critical route handlers...\n');

const tests = [
    // Methods mentioned in the problem statement
    ['RoleController.updateRole', RoleController.updateRole],
    ['ApplicationController.setStatusById', ApplicationController.setStatusById],
    ['ApplicationController.autoCompleteApplication', ApplicationController.autoCompleteApplication],
    ['PersonalityTestController.getAllTemplates', PersonalityTestController.getAllTemplates],
    ['PersonalityTestController.getTemplateById', PersonalityTestController.getTemplateById],
    ['InterviewController.getAllInterviews', InterviewController.getAllInterviews],
    ['DocumentController.uploadDocuments', DocumentController.uploadDocuments],
    ['DocumentController.getDocuments', DocumentController.getDocuments],
    ['EvaluationController.updateTimeKeepingRecord', EvaluationController.updateTimeKeepingRecord],
    ['DepartmentController.createDepartment', DepartmentController.createDepartment],
    ['DepartmentController.getAllDepartments', DepartmentController.getAllDepartments],
];

let errors = 0;

tests.forEach(([name, handler]) => {
    if (typeof handler !== 'function') {
        console.log(`❌ ${name}: NOT A FUNCTION (got ${typeof handler})`);
        errors++;
    } else if (handler.constructor.name === 'AsyncFunction') {
        console.log(`✅ ${name}: async function`);
    } else {
        console.log(`✅ ${name}: function`);
    }
});

if (errors === 0) {
    console.log('\n🎉 All handlers are valid functions!');
} else {
    console.log(`\n💥 Found ${errors} invalid handlers!`);
}

// Additional check: verify all controller exports are objects with methods
const controllers = {
    RoleController,
    ApplicationController,
    PersonalityTestController,
    InterviewController,
    DocumentController,
    DepartmentController,
    EvaluationController
};

console.log('\n📊 Controller Method Counts:');
Object.entries(controllers).forEach(([name, controller]) => {
    const methodCount = Object.keys(controller).length;
    console.log(`${name}: ${methodCount} methods`);
});