const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const Test = require('./models/Test');
const UserAttempt = require('./models/UserAttempt');
// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
require('./config/database')();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('./config/methodOverride')(app);
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    console.log(`Request to: ${req.url}`);
    next();
  });
  
// Cấu hình middleware
app.use(cookieParser());

// API để lưu câu trả lời
app.post('/api/attempts/:attemptId/answers', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer } = req.body;
    
    console.log(`Đang lưu câu trả lời cho attempt ${attemptId}, câu hỏi ${questionId}`);
    
    // Tìm kiếm attempt
    const attempt = await UserAttempt.findById(attemptId);
    
    if (!attempt) {
      console.log(`Không tìm thấy attempt với ID: ${attemptId}`);
      return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi làm bài" });
    }
    
    // Kiểm tra xem answers đã tồn tại chưa
    if (!attempt.answers) {
      attempt.answers = [];
    }
    
    // Tìm kết quả câu hỏi hiện tại nếu có
    const existingResultIndex = attempt.answers.findIndex(
      result => result.questionId && result.questionId.toString() === questionId
    );
    
    if (existingResultIndex >= 0) {
      // Cập nhật câu trả lời hiện có
      attempt.answers[existingResultIndex].userAnswer = answer;
      console.log(`Đã cập nhật câu trả lời cho câu hỏi ${questionId}`);
    } else {
      // Thêm câu trả lời mới
      attempt.answers.push({
        questionId,
        userAnswer: answer,
        isCorrect: false, // Sẽ được tính toán khi nộp bài
        score: 0 // Sẽ được tính toán khi nộp bài
      });
      console.log(`Đã thêm câu trả lời mới cho câu hỏi ${questionId}`);
    }
    
    // Lưu attempt đã cập nhật
    await attempt.save();
    console.log(`Đã lưu attempt thành công`);
    
    res.status(200).json({ success: true, message: "Đã lưu câu trả lời thành công" });
  } catch (error) {
    console.error('Lỗi khi lưu câu trả lời:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// View engine and layouts setup
require('./config/view')(app);

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 ngày
  },
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/testreadingchuan',
    touchAfter: 24 * 3600 // 1 ngày (thời gian tính bằng giây)
  })
};

app.use(session(sessionConfig));

// Middleware để lưu thông tin người dùng vào locals
app.use((req, res, next) => {
  // Đảm bảo rằng _id luôn tồn tại
  if (req.session.user && !req.session.user._id && req.session.user.id) {
    req.session.user._id = req.session.user.id;
  }
  
  res.locals.user = req.session.user || null;
  next();
});

// Middleware để truyền thông tin user vào tất cả các view
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Set up all routes
require('./config/routes')(app);

// Error handling configuration
require('./config/errorHandler')(app);

// Port configuration
app.set('port', process.env.PORT || 3000);

// Cấu hình view engine đã được thiết lập trong config/view.js

// Kiểm tra dữ liệu test
async function checkTestData() {
  try {
    const tests = await Test.find();
    console.log('All tests:', tests);
    
    const activeTests = await Test.find({ active: true });
    console.log('Active tests:', activeTests);
    
    if (activeTests.length === 0) {
      console.log('No active tests found. Consider adding some test data.');
    }
  } catch (error) {
    console.error('Error checking test data:', error);
  }
}

checkTestData();

module.exports = app;