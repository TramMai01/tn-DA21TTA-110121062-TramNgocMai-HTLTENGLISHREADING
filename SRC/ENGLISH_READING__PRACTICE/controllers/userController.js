const User = require('../models/User');
const Test = require('../models/Test');
const ReadingPassage = require('../models/ReadingPassage');
const Question = require('../models/Question');
const UserAttempt = require('../models/UserAttempt');
const mongoose = require('mongoose');

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    console.log('User session:', req.session.user); // Debug log
    
    const userId = req.session.user._id || req.session.user.id;
    console.log('Looking for attempts with user ID:', userId); // Debug log
    
    // Lấy các bài làm gần đây của người dùng - sửa từ userId thành user
    const recentAttempts = await UserAttempt.find({ user: userId })
      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo thay vì completedAt
      .limit(10) // Tăng limit để có nhiều dữ liệu hơn
      .populate('test'); // Sửa từ testId thành test

    console.log('Found attempts:', recentAttempts.length); // Debug log
    console.log('Recent attempts data:', recentAttempts); // Debug log

    // Lấy các bài kiểm tra có sẵn
    const availableTests = await Test.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('Available tests:', availableTests.length); // Debug log

    res.render('user/dashboard', {
      title: 'Dashboard',
      user: req.session.user,
      recentAttempts: recentAttempts || [],
      availableTests: availableTests || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Cannot load dashboard: ' + error.message
    });
  }
};

// Lấy danh sách bài kiểm tra
exports.getTests = async (req, res) => {
  try {
    console.log('Searching for all tests');
    
    // Lấy tham số trang từ query string, mặc định là trang 1
    const page = parseInt(req.query.page) || 1;
    const limit = 3; // 3 test mỗi trang
    const skip = (page - 1) * limit;
    
    // Lấy tham số lọc dạng câu hỏi từ query string
    const questionType = req.query.questionType;

    let testFilter = {};
    if (questionType && questionType !== '') {
      // Lấy tất cả các bài test
      const allTests = await Test.find({});
      const filteredTestIds = [];
      for (const test of allTests) {
        // Lấy tất cả questionId của test này
        const allQuestionIds = test.passages.flatMap(p => p.questions);
        if (allQuestionIds.length === 0) continue;
        // Lấy tất cả question của test này
        const questions = await Question.find({ _id: { $in: allQuestionIds } }).select('questionType');
        // Kiểm tra tất cả questionType đều giống với loại đang lọc
        const allSameType = questions.length > 0 && questions.every(q => q.questionType === questionType);
        if (allSameType) {
          filteredTestIds.push(test._id);
        }
      }
      testFilter = { _id: { $in: filteredTestIds } };
    }

    // Kiểm tra tổng số test sau khi lọc
    const totalTests = await Test.countDocuments(testFilter);
    console.log('Tổng số test trong database:', totalTests);
    
    // Tính tổng số trang
    const totalPages = Math.ceil(totalTests / limit);
    
    // Lấy tests với phân trang và sắp xếp từ cũ tới mới (createdAt tăng dần)
    const tests = await Test.find(testFilter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Fetched tests:', tests); 
    console.log('Number of tests found:', tests.length);
    
    const isLoggedIn = req.session && req.session.user;
    
    res.render('user/tests', {
      title: 'Danh sách bài kiểm tra',
      tests,
      isLoggedIn,
      currentPage: page,
      totalPages: totalPages,
      totalTests: totalTests,
      questionType // truyền xuống view để giữ trạng thái dropdown
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Cannot load test list. Please try again later.'
    });
  }
};

// Lấy trang bắt đầu làm bài
exports.getTestStartForm = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Test Not Found',
        message: 'The test you are looking for does not exist.'
      });
    }
    
    // Tính tổng số câu hỏi
    const totalQuestions = test.passages.reduce((total, passage) => {
      return total + passage.questions.length;
    }, 0);
    
    const isLoggedIn = req.session && req.session.user;
    
    res.render('user/test-start', {
      title: `Bắt đầu: ${test.title}`,
      test,
      totalQuestions,
      isLoggedIn
    });
  } catch (error) {
    console.error('Error loading test start form:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test start form. Please try again later.'
    });
  }
};

// Bắt đầu làm bài test
exports.startTest = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      })
      .populate({
        path: 'passages.questions',
        model: 'Question'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }
    
    // Xử lý tùy chọn thời gian từ form
    let timeLimit = test.timeLimit || 60; // Mặc định là thời gian của bài test
    
    console.log('Form data:', req.body); // Log toàn bộ dữ liệu form
    
    const timeOption = req.body.timeOption;
    const customTimeValue = req.body.customTimeValue;
    
    console.log('Time option received:', timeOption); // Log để debug
    console.log('Custom time value:', customTimeValue); // Log để debug
    
    if (timeOption === 'no_limit') {
      timeLimit = 0; // 0 = không giới hạn thời gian
    } else if (timeOption === 'custom' && customTimeValue) {
      // Nếu là tùy chỉnh thời gian với giá trị từ input
      const customTime = parseInt(customTimeValue);
      if (!isNaN(customTime) && customTime > 0) {
        timeLimit = customTime;
      }
    }
    
    console.log('Final time limit:', timeLimit); // Log để debug
    
    // Tạo bản sao của test để không ảnh hưởng đến dữ liệu gốc
    const testWithCustomTime = JSON.parse(JSON.stringify(test));
    testWithCustomTime.timeLimit = timeLimit;
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isTemporary = !req.session.user;
    let attempt = null;
    
    // Đánh dấu đây là lần làm bài mới
    const isNewAttempt = true;
    
    // Nếu người dùng đã đăng nhập, tạo một bản ghi attempt mới
    if (req.session.user) {
      const userId = req.session.user._id || req.session.user.id;
      
      // Tạo một bản ghi attempt mới
      attempt = new UserAttempt({
        user: userId,
        test: testId,
        score: 0,
        totalPossibleScore: 0,
        percentageScore: 0,
        questionResults: [],
        completedAt: null
      });
      
      try {
        await attempt.save();
        console.log('Created new attempt:', attempt._id);
      } catch (error) {
        console.error('Error creating attempt:', error);
        // Tiếp tục ngay cả khi không thể tạo attempt
      }
    }
    
    // Render trang làm bài
    res.render('user/test-attempt', {
      title: `Làm bài - ${test.title}`,
      test: testWithCustomTime,
      attempt,
      isTemporary,
      isNewAttempt,
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while starting the test: ' + error.message
    });
  }
};

// Hiển thị trang làm bài
exports.getTestAttempt = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }

    // Populate questions cho từng passage
    for (let i = 0; i < test.passages.length; i++) {
      const passage = test.passages[i];
      if (passage.questions && passage.questions.length > 0) {
        // Populate từng question trong array questions
        const populatedQuestions = await Question.find({
          '_id': { $in: passage.questions }
        });
        
        // Sắp xếp questions theo thứ tự trong array gốc
        passage.questions = passage.questions.map(questionId => {
          return populatedQuestions.find(q => q._id.toString() === questionId.toString());
        }).filter(q => q !== undefined);
      }
    }
    
    // Debug log để kiểm tra
    console.log('Test passages count:', test.passages.length);
    test.passages.forEach((passage, index) => {
      console.log(`Passage ${index + 1}:`, {
        passageId: passage.passageId?._id,
        title: passage.passageId?.title,
        questionsCount: passage.questions?.length || 0
      });
    });
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isTemporary = !req.session.user;
    let attempt = null;
    
    // Mặc định không phải là lần làm bài mới
    const isNewAttempt = false;
    
    // Nếu người dùng đã đăng nhập, tìm attempt gần nhất chưa hoàn thành
    if (req.session.user) {
      const userId = req.session.user._id || req.session.user.id;
      
      attempt = await UserAttempt.findOne({
        user: userId,
        test: testId,
        completedAt: null
      }).sort({ createdAt: -1 });
      
      if (attempt) {
        console.log('Found incomplete attempt:', attempt._id);
      } else {
        console.log('No incomplete attempt found');
      }
    }
    
    // Render trang làm bài
    res.render('user/test-attempt', {
      title: `Test - ${test.title}`,
      test,
      attempt,
      isTemporary,
      isNewAttempt,
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Error displaying test attempt page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while displaying the test attempt page: ' + error.message
    });
  }
};

// Lưu câu trả lời
exports.saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer } = req.body;
    
    // Tìm kiếm attempt
    const attempt = await UserAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }
    
    // Tìm kiếm test liên quan
    const test = await Test.findById(attempt.testId);
    
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }
    
    // Tiếp tục xử lý...
    
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xử lý bài làm của người dùng
exports.submitTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const { answers, attemptId, timeSpentInSeconds } = req.body;
    const userId = req.session.user ? (req.session.user._id || req.session.user.id) : null;
    
    console.log('Test submission information:', {
      testId,
      userId,
      attemptId,
      timeSpentInSeconds
    });
    
    // Kiểm tra answers có tồn tại không
    if (!answers || typeof answers !== 'object') {
      return res.status(400).render('error', {
        title: 'Error',
        message: 'Invalid answer data'
      });
    }
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      })
      .populate({
        path: 'passages.questions',
        model: 'Question'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isTemporary = !req.session.user;
    let attempt = null;
    
    // Mặc định không phải là lần làm bài mới
    const isNewAttempt = false;
    
    // Nếu người dùng đã đăng nhập, tìm attempt gần nhất chưa hoàn thành
    if (req.session.user) {
      const userId = req.session.user._id || req.session.user.id;
      
      attempt = await UserAttempt.findOne({
        user: userId,
        test: testId,
        completedAt: null
      }).sort({ createdAt: -1 });
      
      if (attempt) {
        console.log('Found incomplete attempt:', attempt._id);
      } else {
        console.log('No incomplete attempt found');
      }
    }
    
    // Tạo mảng kết quả câu hỏi
    const questionResults = [];
    let totalScore = 0;
    let totalPossibleScore = 0;
    
    // Duyệt qua tất cả các câu hỏi trong test
    for (const passage of test.passages) {
      if (!passage.questions) continue;
      
      for (const question of passage.questions) {
        if (!question || !question._id) continue;
        
        const questionId = question._id.toString();
        const userAnswer = answers[questionId];
        const maxScore = question.score || 1;
        totalPossibleScore += maxScore;
        
        // Sử dụng hàm utility để tính điểm chính xác
        const result = calculateQuestionScore(question, userAnswer);
        const isCorrect = result.isCorrect;
        const earnedScore = result.earnedScore;
        
        // Thêm kết quả vào mảng
        questionResults.push({
          questionId,
          userAnswer,
          isCorrect,
          score: earnedScore
        });
        
        // Cộng điểm
        totalScore += earnedScore;
        
        console.log(`Question ${questionId}: userAnswer=${userAnswer}, isCorrect=${isCorrect}, earnedScore=${earnedScore}, maxScore=${maxScore}`);
      }
    }
    
    console.log(`Final scores: totalScore=${totalScore}, totalPossibleScore=${totalPossibleScore}`);

    // Tính điểm IELTS
    const ieltsResult = convertToIELTSScore(totalScore, totalPossibleScore);
    console.log('IELTS conversion result:', ieltsResult);

    // Tạo đối tượng formattedUserAttempt để lưu thông tin kết quả
    const formattedUserAttempt = {
      testId,
      score: totalScore,
      totalPossibleScore,
      percentageScore: totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0,
      ieltsScore: ieltsResult.ieltsScore,
      ieltsScore40: ieltsResult.score40,
      questionResults,
      completedAt: new Date(),
      timeSpentInSeconds: timeSpentInSeconds ? parseInt(timeSpentInSeconds) : null,
      startTime: null,
      endTime: null
    };
    
    // Lưu kết quả vào cơ sở dữ liệu nếu người dùng đã đăng nhập
    if (userId) {
      let attempt;
      
      if (attemptId) {
        // Cập nhật attempt hiện có
        attempt = await UserAttempt.findById(attemptId);
        
        if (!attempt) {
          return res.status(404).render('error', {
            title: 'Error',
            message: 'Test attempt not found'
          });
        }
        
        // Kiểm tra xem attempt có thuộc về người dùng hiện tại không
        if (attempt.user.toString() !== userId.toString()) {
          return res.status(403).render('error', {
            title: 'Error',
            message: 'You do not have access to this test attempt'
          });
        }
        
        // Cập nhật thông tin
        attempt.answers = questionResults;
        attempt.score = totalScore;
        attempt.totalPossibleScore = totalPossibleScore;
        attempt.percentageScore = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
        attempt.ieltsScore = ieltsResult.ieltsScore;
        attempt.ieltsScore40 = ieltsResult.score40;
        attempt.completedAt = new Date();
        attempt.status = 'completed';
        attempt.timeSpentInSeconds = timeSpentInSeconds ? parseInt(timeSpentInSeconds) : 0;
        
        console.log('Updating attempt with scores:', { totalScore, totalPossibleScore, percentageScore: attempt.percentageScore });
        
        await attempt.save();
      } else {
        // Tạo attempt mới
        attempt = new UserAttempt({
          user: userId,
          test: testId,
          answers: questionResults,
          score: totalScore,
          totalPossibleScore,
          percentageScore: totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0,
          ieltsScore: ieltsResult.ieltsScore,
          ieltsScore40: ieltsResult.score40,
          completedAt: new Date(),
          status: 'completed',
          timeSpentInSeconds: timeSpentInSeconds ? parseInt(timeSpentInSeconds) : 0
        });
        
        console.log('Creating new attempt with scores:', { totalScore, totalPossibleScore, percentageScore: attempt.percentageScore });
        
        await attempt.save();
      }
      
      // Chuyển hướng đến trang kết quả
      return res.redirect(`/user/results/${testId}`);
    }
    
    // Tính phần trăm điểm
    const percentageScore = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
    
    // Lưu kết quả vào session để hiển thị trang kết quả
    req.session.lastAttempt = {
      testId,
      score: totalScore,
      totalPossibleScore,
      percentageScore,
      ieltsScore: ieltsResult.ieltsScore,
      ieltsScore40: ieltsResult.score40,
      questionResults,
      completedAt: new Date(),
      timeSpentInSeconds: timeSpentInSeconds ? parseInt(timeSpentInSeconds) : null,
      startTime: null,
      endTime: null
    };
    
    // Chuyển hướng đến trang kết quả
    return res.redirect(`/user/results/${testId}`);
    
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while submitting the test: ' + error.message
    });
  }
};

// Hiển thị kết quả test
exports.getTestResults = async (req, res) => {
  try {
    const isLoggedIn = req.session && req.session.user;
    let attempts = [];
    
    if (isLoggedIn) {
      // Lấy kết quả từ CSDL cho người dùng đã đăng nhập
      const userId = req.session.user.id;
      attempts = await UserAttempt.find({ user: userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .populate('test', 'title');
    } else {
      // Lấy kết quả tạm thời từ session
      attempts = req.session.tempAttempts || [];
    }
    
    res.render('user/results', {
      title: 'Your Test Results',
      attempts,
      isLoggedIn
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test results. Please try again later.'
    });
  }
};

// Lịch sử làm bài
exports.getHistory = async (req, res) => {
  try {
    const attempts = await UserAttempt.find({ 
      userId: req.session.user.id,
      completedAt: { $ne: null }
    })
    .sort({ completedAt: -1 })
    .populate('testId');
    
    res.render('user/history', {
      title: 'Test History',
      user: req.session.user,
      attempts
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Cannot load test history'
    });
  }
};

// Hiển thị chi tiết test
exports.getTestDetails = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      })
      .populate({
        path: 'passages.questions',
        model: 'Question'
      });
    
    console.log('Test details:', test); // Thêm log để debug
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Test Not Found',
        message: 'The test you are looking for does not exist.'
      });
    }
    
    // Kiểm tra nếu người dùng đã đăng nhập
    const isLoggedIn = req.session && req.session.user;
    
    res.render('user/test-details', {
      title: test.title,
      test,
      isLoggedIn
    });
  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test details. Please try again later.'
    });
  }
};

// Hiển thị chi tiết kết quả bài làm
exports.getTestResultDetails = async (req, res) => {
  try {
    const { testId, attemptId } = req.params;
    
    // Lấy kết quả từ session hoặc database
    let userAttempt;
    
    // Lấy ID người dùng từ session
    const userId = req.session.user ? (req.session.user._id || req.session.user.id) : null;
    
    if (userId && attemptId) {
      // Nếu người dùng đã đăng nhập và có attemptId, lấy kết quả từ database
      try {
        console.log('Searching for test attempt in database with ID:', attemptId);
        userAttempt = await UserAttempt.findById(attemptId);
        
        console.log('Found test attempt:', userAttempt ? userAttempt._id : 'No attempt found');
        console.log('Time spent (seconds):', userAttempt ? userAttempt.timeSpentInSeconds : 'No time spent');
        
        // Chuyển đổi userAttempt từ Mongoose Document sang plain object
        if (userAttempt) {
          userAttempt = userAttempt.toObject();
        }
      } catch (findError) {
        console.error('Error searching for test attempt:', findError);
      }
    } else if (userId) {
      // Nếu người dùng đã đăng nhập nhưng không có attemptId, tìm bản ghi mới nhất
      try {
        console.log('Searching for latest test attempt for user ID:', userId);
        userAttempt = await UserAttempt.findOne({
          test: testId,
          user: userId
        }).sort({ completedAt: -1 });
        
        console.log('Found latest test attempt:', userAttempt ? userAttempt._id : 'No attempt found');
        console.log('Time spent (seconds):', userAttempt ? userAttempt.timeSpentInSeconds : 'No time spent');
        
        // Chuyển đổi userAttempt từ Mongoose Document sang plain object
        if (userAttempt) {
          userAttempt = userAttempt.toObject();
        }
      } catch (findError) {
        console.error('Error searching for latest test attempt:', findError);
      }
    }
    
    // Nếu không tìm thấy kết quả trong database hoặc người dùng chưa đăng nhập, lấy từ session
    if (!userAttempt && req.session.lastAttempt && req.session.lastAttempt.testId == testId) {
      userAttempt = req.session.lastAttempt;
      console.log('Using test attempt from session');
    }
    
    if (!userAttempt) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test result not found'
      });
    }
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      })
      .populate({
        path: 'passages.questions',
        model: 'Question'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }
    
    // Tính tổng điểm của test nếu chưa có
    if (!test.totalScore) {
      let totalScore = 0;
      for (const passage of test.passages) {
        if (passage.questions && Array.isArray(passage.questions)) {
          for (const question of passage.questions) {
            totalScore += (question.score || 1);
          }
        }
      }
      test.totalScore = totalScore;
    }
    
    // Đảm bảo rằng userAttempt có đầy đủ các trường cần thiết
    const formattedUserAttempt = {
      ...userAttempt,
      score: userAttempt.score || 0,
      totalPossibleScore: userAttempt.totalPossibleScore || test.totalScore || 0,
      percentageScore: userAttempt.percentageScore !== undefined ? 
        userAttempt.percentageScore : 
        (userAttempt.totalPossibleScore > 0 ? 
          (userAttempt.score / userAttempt.totalPossibleScore) * 100 : 0),
      completedAt: userAttempt.completedAt ? new Date(userAttempt.completedAt) : new Date(),
      timeSpentInSeconds: userAttempt.timeSpentInSeconds !== undefined ? userAttempt.timeSpentInSeconds : 0
    };
    
    // Đảm bảo rằng questionResults là mảng và có cấu trúc đúng
    const questionResults = Array.isArray(userAttempt.questionResults) ? 
      userAttempt.questionResults : 
      (Array.isArray(userAttempt.answers) ? userAttempt.answers : []);
    
    formattedUserAttempt.questionResults = questionResults.map(result => {
      // Chuyển đổi questionId thành chuỗi nếu là ObjectId
      let questionId = result.questionId;
      if (questionId && typeof questionId === 'object' && questionId.toString) {
        questionId = questionId.toString();
      } else if (questionId) {
        questionId = String(questionId);
      }
      
      return {
        ...result,
        questionId,
        userAnswer: result.userAnswer !== undefined ? result.userAnswer : '',
        isCorrect: result.isCorrect || false,
        score: result.score || 0
      };
    });
    
    console.log('Test attempt formatted:', {
      score: formattedUserAttempt.score,
      totalPossibleScore: formattedUserAttempt.totalPossibleScore,
      percentageScore: formattedUserAttempt.percentageScore,
      questionResultsCount: formattedUserAttempt.questionResults.length
    });
    
    // Tạo bảng tra cứu kết quả câu hỏi để dễ dàng truy cập
    const questionResultsMap = {};
    formattedUserAttempt.questionResults.forEach(result => {
      if (result.questionId) {
        questionResultsMap[result.questionId] = result;
      }
    });
    
    // Tạo dữ liệu chi tiết cho từng câu hỏi
    const detailedQuestions = [];
    
    for (const passage of test.passages) {
      if (!passage.questions || !Array.isArray(passage.questions)) {
        console.log('Skipping passage without questions or questions is not an array');
        continue;
      }
      
      if (!passage.passageId) {
        console.log('Skipping passage without passageId');
        continue;
      }
      
      for (const question of passage.questions) {
        if (!question || !question._id) {
          console.log('Skipping invalid question');
          continue;
        }
        
        const questionId = question._id.toString();
        const result = questionResultsMap[questionId] || {};
        
        // Xử lý hiển thị đáp án dựa trên loại câu hỏi
        let formattedUserAnswer = '';
        let formattedCorrectAnswer = '';
        
        try {
          if (question.questionType === 'multiple_choice' || question.type === 'multiple_choice') {
            if (question.multipleAnswers) {
              // Nhiều đáp án
              try {
                let userAnswerArray = [];
                if (Array.isArray(result.userAnswer)) {
                  userAnswerArray = result.userAnswer;
                } else if (typeof result.userAnswer === 'string') {
                  try {
                    userAnswerArray = JSON.parse(result.userAnswer);
                  } catch {
                    userAnswerArray = [result.userAnswer];
                  }
                }
                
                let correctAnswerArray = [];
                if (Array.isArray(question.correctAnswer)) {
                  correctAnswerArray = question.correctAnswer;
                } else if (typeof question.correctAnswer === 'string') {
                  try {
                    correctAnswerArray = JSON.parse(question.correctAnswer);
                  } catch {
                    correctAnswerArray = [question.correctAnswer];
                  }
                }
                
                // Định dạng đáp án người dùng
                formattedUserAnswer = userAnswerArray.map(answer => {
                  const option = question.options && Array.isArray(question.options) ? 
                    question.options.find(opt => opt.value === answer || opt.id === answer) : null;
                  return option ? option.text : answer;
                }).join(', ');
                
                // Định dạng đáp án đúng
                formattedCorrectAnswer = correctAnswerArray.map(answer => {
                  const option = question.options && Array.isArray(question.options) ? 
                    question.options.find(opt => opt.value === answer || opt.id === answer) : null;
                  return option ? option.text : answer;
                }).join(', ');
                
              } catch (error) {
                console.error('Error formatting multiple choice answer:', error);
                formattedUserAnswer = String(result.userAnswer || '');
                formattedCorrectAnswer = String(question.correctAnswer || '');
              }
            } else {
              // Một đáp án
              try {
                const userOption = question.options && Array.isArray(question.options) ? 
                  question.options.find(opt => opt.value === result.userAnswer || opt.id === result.userAnswer) : null;
                
                const correctOption = question.options && Array.isArray(question.options) ? 
                  question.options.find(opt => opt.value === question.correctAnswer || opt.id === question.correctAnswer) : null;
                
                formattedUserAnswer = userOption ? userOption.text : String(result.userAnswer || '');
                formattedCorrectAnswer = correctOption ? correctOption.text : String(question.correctAnswer || '');
              } catch (error) {
                console.error('Error formatting single choice answer:', error);
                formattedUserAnswer = String(result.userAnswer || '');
                formattedCorrectAnswer = String(question.correctAnswer || '');
              }
            }
          } else if (question.questionType === 'true_false_not_given' || question.type === 'true_false_not_given') {
            // True/False/Not Given
            formattedUserAnswer = String(result.userAnswer || '');
            formattedCorrectAnswer = String(question.correctAnswer || '');
          } else if (question.questionType === 'fill_blank' || question.type === 'fill_blank') {
            // Fill in the blank
              try {
                  let userAnswerObj = {};
                  if (typeof result.userAnswer === 'object' && result.userAnswer !== null) {
                    userAnswerObj = result.userAnswer;
                  } else if (typeof result.userAnswer === 'string') {
                    try {
                      userAnswerObj = JSON.parse(result.userAnswer);
                    } catch {
                  userAnswerObj = { 0: result.userAnswer }; // Nếu không phải JSON, xem như đối tượng đơn giản
                    }
                  }
                  
                  let correctAnswerObj = {};
                  if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
                    correctAnswerObj = question.correctAnswer;
                  } else if (typeof question.correctAnswer === 'string') {
                    try {
                      correctAnswerObj = JSON.parse(question.correctAnswer);
                    } catch {
                  correctAnswerObj = { 0: question.correctAnswer }; // Nếu không phải JSON, xem như đối tượng đơn giản
                    }
                  }
                  
                  // Tạo bảng so sánh đáp án
                  const comparisonTable = [];
                  const allKeys = [...new Set([...Object.keys(userAnswerObj), ...Object.keys(correctAnswerObj)])];
                  let correctCount = 0;
                  let totalPositions = 0;
                  
                  for (const key of allKeys) {
                    if (correctAnswerObj[key] === undefined) continue;
                    
                    totalPositions++;
                    const userValue = userAnswerObj[key] !== undefined ? String(userAnswerObj[key]).trim() : '';
                    
                // Xử lý correctValue có thể là mảng hoặc giá trị đơn
                    let correctValue;
                    let isMatch = false;
                    
                    if (Array.isArray(correctAnswerObj[key])) {
                  // Nếu đáp án đúng là mảng, kiểm tra xem userValue có khớp với bất kỳ giá trị nào trong mảng
                      correctValue = correctAnswerObj[key].map(val => String(val)).join(' / ');
                      isMatch = correctAnswerObj[key].some(val => 
                        String(val).toLowerCase().trim() === userValue.toLowerCase()
                      );
                    } else {
                  // Nếu đáp án đúng là giá trị đơn
                      correctValue = String(correctAnswerObj[key]);
                      isMatch = userValue.toLowerCase() === correctValue.toLowerCase().trim();
                    }
                    
                    if (isMatch) correctCount++;
                    
                    comparisonTable.push({
                      position: key,
                      userAnswer: userValue,
                      correctAnswer: correctValue,
                      isMatch
                    });
                  }
                  
                  // Tính điểm đạt được
                  const earnedScore = totalPositions > 0 ? (correctCount / totalPositions) * (question.score || 1) : 0;
                  const isCorrect = correctCount === totalPositions && totalPositions > 0;
                  
                  // Lưu thông tin so sánh chi tiết
                  question.fillBlankComparison = {
                    userAnswerObj,
                    correctAnswerObj,
                    correctCount,
                    totalPositions,
                    earnedScore,
                    isCorrect,
                    comparisonTable
                  };
                  
              // Cập nhật kết quả câu hỏi dựa trên đánh giá chi tiết
              if (result) {
                result.isCorrect = isCorrect;
                result.score = earnedScore;
              }
                
                // Lưu bảng so sánh để hiển thị
                question.comparisonTable = comparisonTable;
                
                  // Định dạng đáp án để hiển thị tổng quan
                  formattedUserAnswer = Object.entries(userAnswerObj)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                  
                  formattedCorrectAnswer = Object.entries(correctAnswerObj)
                    .map(([key, value]) => {
                      if (Array.isArray(value)) {
                        return `${key}: ${value.join(' / ')}`;
                      }
                      return `${key}: ${value}`;
                    })
                    .join(', ');
                  
              } catch (error) {
                console.error('Error formatting fill blank answer:', error);
                formattedUserAnswer = String(result.userAnswer || '');
                formattedCorrectAnswer = String(question.correctAnswer || '');
              }
            } else if (question.questionType === 'matching' || question.type === 'matching') {
              // Matching
              try {
                let userAnswerObj = {};
              if (typeof result.userAnswer === 'object' && result.userAnswer !== null) {
                userAnswerObj = result.userAnswer;
              } else if (typeof result.userAnswer === 'string') {
                  try {
                  userAnswerObj = JSON.parse(result.userAnswer);
                  } catch {
                    userAnswerObj = {}; // Nếu không phải JSON, xem như đối tượng rỗng
                  }
                }
                
                let correctAnswerObj = {};
                if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
                  correctAnswerObj = question.correctAnswer;
                  
                  // Kiểm tra nếu có cấu trúc với type và selections
                  if (correctAnswerObj.type && correctAnswerObj.selections) {
                    correctAnswerObj = correctAnswerObj.selections;
                  }
                } else if (typeof question.correctAnswer === 'string') {
                  try {
                    const parsed = JSON.parse(question.correctAnswer);
                    // Kiểm tra nếu có cấu trúc với type và selections
                    if (parsed.type && parsed.selections) {
                      correctAnswerObj = parsed.selections;
                    } else {
                      correctAnswerObj = parsed;
                    }
                  } catch {
                    correctAnswerObj = {}; // Nếu không phải JSON, xem như đối tượng rỗng
                  }
                }
                
                // Tạo chi tiết so sánh
                const comparisonDetails = [];
                const allKeys = [...new Set([...Object.keys(userAnswerObj), ...Object.keys(correctAnswerObj)])];
                let correctCount = 0;
                let totalPositions = 0;
                
                for (const key of allKeys) {
                  if (correctAnswerObj[key] === undefined) continue;
                  
                  totalPositions++;
                  const userValue = userAnswerObj[key] !== undefined ? String(userAnswerObj[key]) : '';
                  const correctValue = String(correctAnswerObj[key]);
                  const isMatch = userValue === correctValue;
                  
                  if (isMatch) correctCount++;
                  
                  comparisonDetails.push({
                    key,
                    userValue,
                    correctValue,
                    isMatch
                  });
                }
                
                // Tính điểm đạt được
                const earnedScore = totalPositions > 0 ? (correctCount / totalPositions) * (question.score || 1) : 0;
                const isCorrect = correctCount === totalPositions && totalPositions > 0;
                
                // Lưu thông tin so sánh chi tiết
                question.matchingComparison = {
                  userAnswerObj,
                  correctAnswerObj,
                  correctCount,
                  totalPositions,
                  earnedScore,
                  isCorrect,
                  comparisonDetails
                };
                
                // Quan trọng: Cập nhật kết quả câu hỏi dựa trên đánh giá chi tiết
              if (result) {
                result.isCorrect = isCorrect;
                result.score = earnedScore;
                }
                
                console.log('Matching comparison (detailed):', question.matchingComparison);
                
                // Tìm text cho các mục bên trái và bên phải
                const comparisonTable = [];
                
                for (const detail of comparisonDetails) {
                  let leftText = detail.key;
                  let userRightText = detail.userValue;
                  let correctRightText = detail.correctValue;
                  
                  // Kiểm tra xem matchingItems và matchingOptions có tồn tại và là mảng không
                  if (question.matchingItems && Array.isArray(question.matchingItems)) {
                    const leftItem = question.matchingItems.find(item => 
                      item.id === detail.key || item.value === detail.key
                    );
                    if (leftItem) {
                      leftText = leftItem.text || leftText;
                    }
                  }
                  
                  if (question.matchingOptions && Array.isArray(question.matchingOptions)) {
                    const userRightItem = question.matchingOptions.find(item => 
                      item.id === detail.userValue || item.value === detail.userValue
                    );
                    if (userRightItem) {
                      userRightText = userRightItem.text || userRightText;
                    }
                    
                    const correctRightItem = question.matchingOptions.find(item => 
                      item.id === detail.correctValue || item.value === detail.correctValue
                    );
                    if (correctRightItem) {
                      correctRightText = correctRightItem.text || correctRightText;
                    }
                  }
                  
                  comparisonTable.push({
                    leftItem: leftText,
                    userAnswer: userRightText,
                    correctAnswer: correctRightText,
                    isMatch: detail.isMatch
                  });
                }
                
                // Lưu bảng so sánh để hiển thị
                question.comparisonTable = comparisonTable;
                
                // Định dạng đáp án để hiển thị tổng quan
                formattedUserAnswer = Object.entries(userAnswerObj)
                  .map(([key, value]) => {
                    let leftText = key;
                    let rightText = value;
                    
                    if (question.matchingItems && Array.isArray(question.matchingItems)) {
                      const leftItem = question.matchingItems.find(item => 
                        item.id === key || item.value === key
                      );
                      if (leftItem) {
                        leftText = leftItem.text || leftText;
                      }
                    }
                    
                    if (question.matchingOptions && Array.isArray(question.matchingOptions)) {
                      const rightItem = question.matchingOptions.find(item => 
                        item.id === value || item.value === value
                      );
                      if (rightItem) {
                        rightText = rightItem.text || rightText;
                      }
                    }
                    
                    return `${leftText} → ${rightText}`;
                  })
                  .join(', ');
                
                formattedCorrectAnswer = Object.entries(correctAnswerObj)
                  .map(([key, value]) => {
                    let leftText = key;
                    let rightText = value;
                    
                    if (question.matchingItems && Array.isArray(question.matchingItems)) {
                      const leftItem = question.matchingItems.find(item => 
                        item.id === key || item.value === key
                      );
                      if (leftItem) {
                        leftText = leftItem.text || leftText;
                      }
                    }
                    
                    if (question.matchingOptions && Array.isArray(question.matchingOptions)) {
                      const rightItem = question.matchingOptions.find(item => 
                        item.id === value || item.value === value
                      );
                      if (rightItem) {
                        rightText = rightItem.text || rightText;
                      }
                    }
                    
                    return `${leftText} → ${rightText}`;
                  })
                  .join(', ');
                
              } catch (error) {
                console.error('Error formatting matching answer:', error);
              formattedUserAnswer = String(result.userAnswer || '');
                formattedCorrectAnswer = String(question.correctAnswer || '');
              }
            } else if (question.questionType === 'short_answer' || question.type === 'short_answer') {
              // Short answer
              formattedUserAnswer = String(result.userAnswer || '');
                
                // Lấy danh sách các đáp án chấp nhận được
                let acceptableAnswers = [];
                
                if (question.acceptableShortAnswers) {
                  if (Array.isArray(question.acceptableShortAnswers)) {
                    acceptableAnswers = question.acceptableShortAnswers;
                  } else if (typeof question.acceptableShortAnswers === 'string') {
                    try {
                      const parsed = JSON.parse(question.acceptableShortAnswers);
                      acceptableAnswers = Array.isArray(parsed) ? parsed : [question.acceptableShortAnswers];
                    } catch {
                      acceptableAnswers = [question.acceptableShortAnswers];
                    }
                  }
                } else if (question.correctAnswer) {
                  if (Array.isArray(question.correctAnswer)) {
                    acceptableAnswers = question.correctAnswer;
                  } else {
                    acceptableAnswers = [question.correctAnswer];
                  }
                }
                
              formattedCorrectAnswer = acceptableAnswers.join(' / ');
            } else {
              // Loại câu hỏi khác
              formattedUserAnswer = String(result.userAnswer || '');
              formattedCorrectAnswer = String(question.correctAnswer || '');
            }
          } catch (error) {
            console.error(`Error processing question ${questionId}:`, error);
            formattedUserAnswer = String(result.userAnswer || '');
            formattedCorrectAnswer = String(question.correctAnswer || '');
          }
          
          // Thêm thông tin chi tiết câu hỏi
          detailedQuestions.push({
            question,
            result,
            formattedUserAnswer,
            formattedCorrectAnswer,
            passageId: passage.passageId._id
          });
        }
      }
      
      // Cập nhật lại tổng điểm dựa trên kết quả chi tiết
      let updatedTotalScore = 0;
      for (const detail of detailedQuestions) {
        if (detail.result && detail.result.score) {
          updatedTotalScore += detail.result.score;
        }
      }
      
      // Cập nhật lại điểm số trong formattedUserAttempt
      formattedUserAttempt.score = updatedTotalScore;
      formattedUserAttempt.percentageScore = formattedUserAttempt.totalPossibleScore > 0 ? 
        (updatedTotalScore / formattedUserAttempt.totalPossibleScore) * 100 : 0;
      
      // Tính toán số câu đúng và tổng số câu
      const correctCount = formattedUserAttempt.questionResults.filter(result => result.isCorrect).length;
      const totalQuestions = formattedUserAttempt.questionResults.length;
      
      // Render trang kết quả với dữ liệu chi tiết
      res.render('user/test-result', {
        title: 'Test Result Details',
        test,
        userAttempt: formattedUserAttempt,
        detailedQuestions,
        questionResultsMap
      });
      
    } catch (error) {
      console.error('Error fetching test result details:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Cannot load test result details. Please try again later.'
      });
    }
  };

exports.startTestAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Tìm kiếm test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages',
        populate: {
          path: 'questions'
        }
      });
    
    if (!test) {
      return res.status(404).render('error', { 
        message: 'Test does not exist',
        error: { status: 404 }
      });
    }
    
    // Tạo attempt mới
    const attempt = new Attempt({
      testId: test._id,
      userId: req.user ? req.user._id : null,
      isTemporary: !req.user,
      startTime: new Date()
    });
    
    await attempt.save();
    
    // Render view với dữ liệu đúng
    res.render('user/test-attempt', {
      test: test,
      attempt: attempt,
      isTemporary: !req.user,
      layout: 'layouts/main'
    });
    
  } catch (error) {
    console.error('Error starting test attempt:', error);
    res.status(500).render('error', { 
      message: 'An error occurred while starting the test',
      error: { status: 500 }
    });
  }
};

// Xem bài kiểm tra với tư cách khách
exports.viewTestAsGuest = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }
    
    // Render trang làm bài
    res.render('user/test-attempt', {
      title: test.title,
      test,
      user: null,
      isGuest: true
    });
    
  } catch (error) {
    console.error('Error viewing test as guest:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while viewing the test: ' + error.message
    });
  }
};

// Nộp bài với tư cách khách
exports.submitTestAsGuest = async (req, res) => {
  try {
    const testId = req.params.id;
    const { answers, timeSpentInSeconds } = req.body;
    
    console.log('Guest Test ID:', testId);
    console.log('Guest Answers received:', answers);
    
    // Lấy thông tin test với populate đúng cách
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      })
      .populate({
        path: 'passages.questions',
        model: 'Question'
      });
    
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test not found' 
      });
    }
    
    // Tính điểm và kết quả
    let totalScore = 0;
    let totalPossibleScore = 0;
    const questionResults = [];
    
    // Lặp qua từng passage và từng câu hỏi trong passage
    for (const passage of test.passages) {
      for (const question of passage.questions) {
        const userAnswer = answers[question._id];
        let isCorrect = false;
        let score = 0;
        
        // Tính điểm tối đa có thể đạt được
        totalPossibleScore += (question.score || 1);
        
        // Kiểm tra câu trả lời dựa vào loại câu hỏi
        if (userAnswer) {
          // Kiểm tra câu trả lời dựa vào loại câu hỏi
          if (question.questionType === 'multiple_choice' || question.questionType === 'multiple-choice' || 
              question.type === 'multiple_choice' || question.type === 'multiple-choice') {
            // Xử lý câu hỏi trắc nghiệm
            isCorrect = question.correctAnswer === userAnswer;
            score = isCorrect ? (question.score || 1) : 0;
          } else if (question.questionType === 'true_false_not_given' || question.type === 'true_false_not_given') {
            // Xử lý câu hỏi đúng/sai/không đề cập
            isCorrect = question.correctAnswer === userAnswer;
            score = isCorrect ? (question.score || 1) : 0;
          } else if (question.questionType === 'matching' || question.type === 'matching') {
            // Xử lý câu hỏi nối
            try {
              let userMatches;
              
              // Kiểm tra xem userAnswer có phải là chuỗi JSON hợp lệ không
              if (typeof userAnswer === 'string' && (userAnswer.startsWith('{') || userAnswer.startsWith('['))) {
                try {
                  userMatches = JSON.parse(userAnswer);
                } catch (parseError) {
                  console.error('Error parsing user answer JSON:', parseError);
                  userMatches = userAnswer;
                }
              } else if (typeof userAnswer === 'object') {
                userMatches = userAnswer;
              } else {
                userMatches = userAnswer;
              }
              
              // Tương tự cho correctAnswer
              let correctMatches;
              if (typeof question.correctAnswer === 'string' && 
                  (question.correctAnswer.startsWith('{') || question.correctAnswer.startsWith('['))) {
                try {
                  const parsed = JSON.parse(question.correctAnswer);
                  // Kiểm tra nếu có cấu trúc với type và selections
                  if (parsed.type && parsed.selections) {
                    correctMatches = parsed.selections;
                  } else {
                    correctMatches = parsed;
                  }
                } catch (parseError) {
                  console.error('Error parsing correct answer JSON:', parseError);
                  correctMatches = question.correctAnswer;
                }
              } else if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
                // Kiểm tra nếu có cấu trúc với type và selections
                if (question.correctAnswer.type && question.correctAnswer.selections) {
                  correctMatches = question.correctAnswer.selections;
                } else {
                  correctMatches = question.correctAnswer;
                }
              } else {
                correctMatches = question.correctAnswer;
              }
              
              // So sánh câu trả lời
              let matchCorrectCount = 0;
              let totalMatches = 0;
              
              // Kiểm tra xem userMatches và correctMatches có phải là mảng không
              if (Array.isArray(correctMatches) && Array.isArray(userMatches)) {
                totalMatches = correctMatches.length;
                for (let i = 0; i < correctMatches.length; i++) {
                  if (i < userMatches.length && userMatches[i] === correctMatches[i]) {
                    matchCorrectCount++;
                  }
                }
              } else if (typeof correctMatches === 'object' && correctMatches !== null && 
                         typeof userMatches === 'object' && userMatches !== null) {
                // Xử lý trường hợp đối tượng
                const correctKeys = Object.keys(correctMatches);
                totalMatches = correctKeys.length;
                
                for (const key of correctKeys) {
                  if (userMatches[key] === correctMatches[key]) {
                    matchCorrectCount++;
                  }
                }
              } else {
                console.warn('Incompatible matching answer formats:', { userMatches, correctMatches });
              }
              
              // Tính điểm dựa trên số cặp nối đúng
              isCorrect = totalMatches > 0 && matchCorrectCount === totalMatches;
              score = totalMatches > 0 ? (matchCorrectCount / totalMatches) * (question.score || 1) : 0;
              
            } catch (e) {
              console.error('Error processing matching answers:', e, {
                questionId: question._id,
                userAnswer,
                correctAnswer: question.correctAnswer
              });
            }
          } else if (question.questionType === 'fill_blank' || question.type === 'fill_blank') {
            // Xử lý câu hỏi điền vào chỗ trống
            isCorrect = question.correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
            score = isCorrect ? (question.score || 1) : 0;
          } else if (question.questionType === 'short_answer' || question.type === 'short_answer') {
            // Xử lý câu hỏi trả lời ngắn
            const userAnswerLower = userAnswer.toLowerCase().trim();
            
            // Kiểm tra xem có khớp với bất kỳ đáp án nào không
            isCorrect = question.acceptableShortAnswers && 
                        question.acceptableShortAnswers.some(answer => 
                          answer.toLowerCase().trim() === userAnswerLower
                        );
            score = isCorrect ? (question.score || 1) : 0;
          }
        }
        
        // Thêm kết quả câu hỏi
        questionResults.push({
          questionId: question._id,
          userAnswer: userAnswer || '',
          isCorrect,
          score
        });
        
        // Cộng điểm
        totalScore += score;
      }
    }
    
    // Tính phần trăm điểm
    const percentageScore = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
    
    // Lưu kết quả vào session để hiển thị trang kết quả
    req.session.lastAttempt = {
      testId,
      score: totalScore,
      totalPossibleScore,
      percentageScore,
      questionResults,
      completedAt: new Date(),
      // Thêm thông tin thời gian
      timeSpentInSeconds: timeSpentInSeconds ? parseInt(timeSpentInSeconds) : null,
      startTime: null,
      endTime: null
    };
    
    // Chuyển hướng đến trang kết quả
    return res.redirect(`/user/results/${testId}`);
    
  } catch (error) {
    console.error('Error submitting test as guest:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while submitting the test: ' + error.message
    });
  }
};

// Xem lịch sử làm bài
exports.viewTestHistory = async (req, res) => {
  try {
    // Lấy ID người dùng từ session
    const userId = req.session.user ? (req.session.user._id || req.session.user.id) : null;
    
    if (!userId) {
      return res.status(401).render('error', {
        title: 'Error',
        message: 'You need to login to view your test history'
      });
    }
    
    console.log('Looking for test history for user ID:', userId);
    
    // Lấy lịch sử làm bài của người dùng
    const attempts = await UserAttempt.find({ user: userId })
      .populate('test')
      .sort({ completedAt: -1 });
    
    console.log('Found attempts:', attempts.length);
    
    // Render trang lịch sử làm bài
    res.render('user/test-history', {
      title: 'Lịch sử làm bài',
      attempts,
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Error viewing test history:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while viewing the test history: ' + error.message
    });
  }
};

// Tiếp tục làm bài test đã bắt đầu
exports.resumeTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const attemptId = req.params.attemptId;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }

    // Populate questions cho từng passage
    for (let i = 0; i < test.passages.length; i++) {
      const passage = test.passages[i];
      if (passage.questions && passage.questions.length > 0) {
        const populatedQuestions = await Question.find({
          '_id': { $in: passage.questions }
        });
        
        passage.questions = passage.questions.map(questionId => {
          return populatedQuestions.find(q => q._id.toString() === questionId.toString());
        }).filter(q => q !== undefined);
      }
    }
    
    // ... rest of the function remains the same ...
  } catch (error) {
    console.error('Error resuming test:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while continuing the test: ' + error.message
    });
  }
};

// Tiếp tục làm bài test
exports.continueTest = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }

    // Populate questions cho từng passage
    for (let i = 0; i < test.passages.length; i++) {
      const passage = test.passages[i];
      if (passage.questions && passage.questions.length > 0) {
        const populatedQuestions = await Question.find({
          '_id': { $in: passage.questions }
        });
        
        passage.questions = passage.questions.map(questionId => {
          return populatedQuestions.find(q => q._id.toString() === questionId.toString());
        }).filter(q => q !== undefined);
      }
    }
    
    // ... rest of the function remains the same ...
  } catch (error) {
    console.error('Error continuing test:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while continuing the test: ' + error.message
    });
  }
};

// Xem thông tin bài test
exports.viewTest = async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Lấy thông tin test
    const test = await Test.findById(testId)
      .populate({
        path: 'passages.passageId',
        model: 'ReadingPassage'
      });
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test not found'
      });
    }
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isTemporary = !req.session.user;
    let attempt = null;
    
    // Mặc định không phải là lần làm bài mới
    const isNewAttempt = false;
    
    // Nếu người dùng đã đăng nhập, tìm attempt gần nhất chưa hoàn thành
    if (req.session.user) {
      const userId = req.session.user._id || req.session.user.id;
      
      attempt = await UserAttempt.findOne({
        user: userId,
        test: testId,
        completedAt: null
      }).sort({ createdAt: -1 });
    }
    
    // Render trang thông tin bài test
    res.render('user/test-detail', {
      title: test.title,
      test,
      attempt,
      isTemporary,
      isNewAttempt,
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Error viewing test:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while viewing the test: ' + error.message
    });
  }
};

// Hàm chuyển đổi điểm sang thang điểm IELTS
function convertToIELTSScore(rawScore, totalPossibleScore) {
  if (totalPossibleScore === 0) return 0;
  
  // Tính tỷ lệ phần trăm và chuyển về thang 40 điểm chuẩn IELTS Reading
  const percentage = (rawScore / totalPossibleScore) * 100;
  const score40 = Math.round((percentage / 100) * 40);
  
  // Bảng chuyển đổi điểm IELTS Reading
  const ieltsConversionTable = [
    { min: 39, max: 40, ielts: 9.0 },
    { min: 37, max: 38, ielts: 8.5 },
    { min: 35, max: 36, ielts: 8.0 },
    { min: 33, max: 34, ielts: 7.5 },
    { min: 30, max: 32, ielts: 7.0 },
    { min: 27, max: 29, ielts: 6.5 },
    { min: 23, max: 26, ielts: 6.0 },
    { min: 19, max: 22, ielts: 5.5 },
    { min: 15, max: 18, ielts: 5.0 },
    { min: 13, max: 14, ielts: 4.5 },
    { min: 10, max: 12, ielts: 4.0 },
    { min: 8, max: 9, ielts: 3.5 },
    { min: 6, max: 7, ielts: 3.0 }
  ];
  
  // Tìm điểm IELTS tương ứng
  for (const range of ieltsConversionTable) {
    if (score40 >= range.min && score40 <= range.max) {
      return {
        ieltsScore: range.ielts,
        score40: score40,
        percentage: percentage
      };
    }
  }
  
  // Nếu dưới 6 điểm thì trả về 3.0 (mức thấp nhất)
  return {
    ieltsScore: 3.0,
    score40: score40,
    percentage: percentage
  };
}

// Hàm utility để tính điểm chính xác cho từng loại câu hỏi
function calculateQuestionScore(question, userAnswer) {
  const maxScore = question.score || 1;
  let isCorrect = false;
  let earnedScore = 0;
  
  // Kiểm tra nếu không có câu trả lời
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return { isCorrect: false, earnedScore: 0 };
  }
  
  try {
    switch (question.questionType || question.type) {
      case 'multiple_choice':
        if (question.multipleAnswers) {
          // Câu hỏi nhiều đáp án
          let userAnswerArray = Array.isArray(userAnswer) ? userAnswer : 
                              (typeof userAnswer === 'string' ? JSON.parse(userAnswer) : [userAnswer]);
          let correctAnswerArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : 
                                 (typeof question.correctAnswer === 'string' ? JSON.parse(question.correctAnswer) : [question.correctAnswer]);
          
          const sortedUserAnswers = [...userAnswerArray].sort();
          const sortedCorrectAnswers = [...correctAnswerArray].sort();
          isCorrect = JSON.stringify(sortedUserAnswers) === JSON.stringify(sortedCorrectAnswers);
        } else {
          // Câu hỏi một đáp án
          isCorrect = String(userAnswer) === String(question.correctAnswer);
        }
        earnedScore = isCorrect ? maxScore : 0;
        break;
        
      case 'true_false_not_given':
        isCorrect = String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
        earnedScore = isCorrect ? maxScore : 0;
        break;
        
             case 'fill_blank':
         let userAnswerObj = {};
         let correctAnswerObj = {};
         
         // Parse user answer
         if (typeof userAnswer === 'object' && userAnswer !== null) {
           userAnswerObj = userAnswer;
         } else if (typeof userAnswer === 'string') {
           try {
             userAnswerObj = JSON.parse(userAnswer);
           } catch {
             userAnswerObj = { 0: userAnswer };
           }
         }
         
         // Parse correct answer
         if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
           correctAnswerObj = question.correctAnswer;
         } else if (typeof question.correctAnswer === 'string') {
           try {
             correctAnswerObj = JSON.parse(question.correctAnswer);
           } catch {
             correctAnswerObj = { 0: question.correctAnswer };
           }
         }
         
         // Tính số câu đúng
         let correctCount = 0;
         let totalPositions = Object.keys(correctAnswerObj).length;
         
         for (const key of Object.keys(correctAnswerObj)) {
           const userValue = userAnswerObj[key] ? String(userAnswerObj[key]).trim().toLowerCase() : '';
           const correctValue = String(correctAnswerObj[key]).trim().toLowerCase();
           
           if (userValue === correctValue) {
             correctCount++;
           }
         }
         
         // Tính điểm theo tỷ lệ: (số đúng / tổng số) * điểm tối đa
         isCorrect = correctCount === totalPositions && totalPositions > 0;
         earnedScore = totalPositions > 0 ? Math.round((correctCount / totalPositions) * maxScore) : 0;
         break;
        
             case 'matching':
         let userMatchObj = {};
         let correctMatchObj = {};
         
         // Parse user answer
         if (typeof userAnswer === 'object' && userAnswer !== null) {
           userMatchObj = userAnswer;
         } else if (typeof userAnswer === 'string') {
           try {
             userMatchObj = JSON.parse(userAnswer);
           } catch {
             userMatchObj = {};
           }
         }
         
         // Parse correct answer - Xử lý cấu trúc phức tạp
         if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
           correctMatchObj = question.correctAnswer;
           
           // Kiểm tra nếu có cấu trúc với type và selections
           if (correctMatchObj.type && correctMatchObj.selections) {
             correctMatchObj = correctMatchObj.selections;
           }
         } else if (typeof question.correctAnswer === 'string') {
           try {
             const parsed = JSON.parse(question.correctAnswer);
             // Kiểm tra nếu có cấu trúc với type và selections
             if (parsed.type && parsed.selections) {
               correctMatchObj = parsed.selections;
             } else {
               correctMatchObj = parsed;
             }
           } catch {
             correctMatchObj = {}; // Nếu không phải JSON, xem như đối tượng rỗng
           }
         }
         
         // ✅ CHỈ tính số cặp CẦN GHÉP (được định nghĩa trong correctAnswer)
         // KHÔNG tính tất cả options có sẵn
         let matchCorrectCount = 0;
         let totalMatches = Object.keys(correctMatchObj).length; // Số cặp CẦN ghép
         
         for (const key of Object.keys(correctMatchObj)) {
           const userValue = userMatchObj[key] !== undefined ? String(userMatchObj[key]) : '';
           const correctValue = String(correctMatchObj[key]);
           
           if (userValue === correctValue) {
             matchCorrectCount++;
           }
         }
         
         // Tính điểm theo tỷ lệ: (số đúng / tổng số CẦN ghép) * điểm tối đa
         isCorrect = matchCorrectCount === totalMatches && totalMatches > 0;
         earnedScore = totalMatches > 0 ? Math.round((matchCorrectCount / totalMatches) * maxScore) : 0;
         break;
         
       case 'short_answer':
         const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
         
         // Lấy danh sách các đáp án chấp nhận được
         let acceptableAnswers = [];
         
         if (question.acceptableShortAnswers && Array.isArray(question.acceptableShortAnswers)) {
           acceptableAnswers = question.acceptableShortAnswers;
         } else if (question.correctAnswer) {
           acceptableAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
         }
         
         // Chuẩn hóa tất cả các đáp án chấp nhận được
         const normalizedAcceptableAnswers = acceptableAnswers.map(answer => 
           String(answer).trim().toLowerCase()
         );
         
         // Kiểm tra xem đáp án của người dùng có nằm trong danh sách không
         isCorrect = normalizedAcceptableAnswers.includes(normalizedUserAnswer);
         earnedScore = isCorrect ? maxScore : 0;
         break;
         
       default:
         isCorrect = false;
         earnedScore = 0;
     }
  } catch (error) {
    console.error('Error calculating question score:', error);
    isCorrect = false;
    earnedScore = 0;
  }
  
  return { isCorrect, earnedScore };
}