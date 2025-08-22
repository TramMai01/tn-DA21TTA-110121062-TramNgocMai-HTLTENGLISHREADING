const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, optionalAuth } = require('../middleware/auth');
// Đầu file
const UserAttempt = require('../models/UserAttempt');


// Dashboard - yêu cầu đăng nhập
router.get('/dashboard', isAuthenticated, userController.getDashboard);

// Routes cho tests - cho phép cả người dùng đăng nhập và không đăng nhập
router.get('/tests', optionalAuth, userController.getTests);
router.get('/tests/:id', optionalAuth, userController.getTestDetails);
router.get('/tests/:id/start', optionalAuth, userController.getTestStartForm);
router.post('/tests/:id/submit', optionalAuth, userController.submitTest);

// Thêm route cho việc bắt đầu làm bài test
router.post('/tests/:id/attempt', optionalAuth, userController.startTest);

// Xem kết quả tests - cho phép cả người dùng đăng nhập và không đăng nhập
router.get('/results', optionalAuth, userController.getTestResults);

// Thêm route để hiển thị kết quả bài làm
router.get('/results/:testId', optionalAuth, userController.getTestResultDetails);

// Thêm route để hiển thị kết quả bài làm với attemptId
router.get('/results/:testId/:attemptId', optionalAuth, userController.getTestResultDetails);

// Route cho người dùng chưa đăng nhập
router.get('/guest/tests/:id', userController.viewTestAsGuest);
router.post('/guest/tests/:id/submit', userController.submitTestAsGuest);

// Route để xem lịch sử làm bài
router.get('/history', isAuthenticated, userController.viewTestHistory);

// Bắt đầu làm bài mới
router.get('/tests/:id/start-new', isAuthenticated, userController.startTest);

// Tiếp tục làm bài đã bắt đầu
router.get('/tests/:id/continue', isAuthenticated, userController.continueTest);



module.exports = router;