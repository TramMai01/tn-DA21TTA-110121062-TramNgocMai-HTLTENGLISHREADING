const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Apply admin authentication middleware to all admin routes
router.use(isAuthenticated);
router.use(isAdmin);

// Admin dashboard
router.get('/dashboard', adminController.getDashboard);

// Reading passages management
router.get('/passages', adminController.getPassages);
router.get('/api/passages/search', adminController.searchPassages);
router.get('/passages/create', adminController.getCreatePassageForm);
router.post('/passages/create', adminController.createPassage);
router.get('/passages/:passageId', adminController.getPassageDetails);
router.get('/passages/:passageId/edit', adminController.getEditPassageForm);
router.post('/passages/:passageId/edit', adminController.updatePassage);
router.delete('/passages/:passageId', adminController.deletePassage);

// Questions management
router.get('/passages/:passageId/questions/create', adminController.getCreateQuestionForm);
router.post('/passages/:passageId/questions/create', adminController.createQuestion);
router.get('/questions/:questionId/edit', adminController.getEditQuestionForm);
router.post('/questions/:questionId/edit', adminController.updateQuestion);
router.delete('/questions/:questionId', adminController.deleteQuestion);

// Tests management
router.get('/tests', adminController.getTests);
router.get('/tests/create', adminController.getCreateTestForm);
router.post('/tests/create', adminController.createTest);
router.get('/tests/:testId/detail', adminController.getTestDetails);
router.get('/tests/:testId', adminController.getTestDetails);
router.get('/tests/:testId/edit', adminController.getEditTestForm);
router.post('/tests/:testId/edit', adminController.updateTest);
router.delete('/tests/:testId', adminController.deleteTest);
router.get('/passages/:passageId/questions', adminController.getPassageQuestions);

// Test pools management
router.get('/pools', adminController.getTestPools);
router.get('/pools/create', adminController.getCreateTestPoolForm);
router.post('/pools/create', adminController.createTestPool);
router.delete('/pools/:poolId', adminController.deleteTestPool);
// Test pools management
router.get('/pools/:poolId/generate', adminController.generateRandomTest);

// Statistics and reports
router.get('/statistics/tests', adminController.getTestStatistics);
router.get('/statistics/users', adminController.getUserStatistics);

module.exports = router;