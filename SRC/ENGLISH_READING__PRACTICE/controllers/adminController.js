const User = require('../models/User');
const ReadingPassage = require('../models/ReadingPassage');
const Question = require('../models/Question');
const Test = require('../models/Test');
const TestPool = require('../models/TestPool');
const UserAttempt = require('../models/UserAttempt');
const mongoose = require('mongoose');

// Thêm hàm getNextQuestionOrder ở đầu file hoặc trước hàm createQuestion
/**
 * Lấy số thứ tự tiếp theo cho câu hỏi mới
 * @param {string} passageId - ID của bài đọc
 * @returns {Promise<number>} - Số thứ tự tiếp theo
 */
async function getNextQuestionOrder(passageId) {
  const lastQuestion = await Question.findOne({ passageId })
    .sort({ order: -1 })
    .limit(1);
  
  return lastQuestion ? lastQuestion.order + 1 : 1;
}

// Thêm hàm này ở đầu file hoặc trước hàm createQuestion
/**
 * Lấy mô hình câu hỏi để kiểm tra định dạng correctAnswer
 */
async function getQuestionModel() {
  try {
    // Lấy một câu hỏi matching đã tồn tại để xem định dạng
    const existingMatchingQuestion = await Question.findOne({ questionType: 'matching' });
    if (existingMatchingQuestion) {
      console.log("Existing matching question correctAnswer format:", 
        JSON.stringify(existingMatchingQuestion.correctAnswer));
      return existingMatchingQuestion.correctAnswer;
    }
    return null;
  } catch (error) {
    console.error("Error getting question model:", error);
    return null;
  }
}

// Kiểm tra schema của Question
console.log("Question schema paths:", Object.keys(Question.schema.paths));
console.log("correctAnswer validator:", Question.schema.paths.correctAnswer?.validators);

// Admin dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Lấy thống kê cơ bản
    const userCount = await User.countDocuments();
    const passageCount = await ReadingPassage.countDocuments();
    const testCount = await Test.countDocuments();
    const questionCount = await Question.countDocuments();
    
    // Lấy người dùng mới nhất
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt avatar')
      .lean();
    
    // Lấy kết quả test gần đây - sửa lại populate
    const recentResults = await UserAttempt.find({ completedAt: { $exists: true } })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('user', 'username')  
      .populate('test', 'title')     
      .lean();
    
    // Lấy passages mới nhất
    const recentPassages = await ReadingPassage.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username')
      .lean();
    
    // Lấy tests mới nhất
    const recentTests = await Test.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username')
      .lean();
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        userCount,
        passageCount,
        testCount,
        questionCount
      },
      recentUsers: recentUsers || [],
      recentResults: recentResults || [],
      recentPassages: recentPassages || [],
      recentTests: recentTests || []
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Không thể tải dashboard: ' + error.message
    });
  }
};

// ===== READING PASSAGES MANAGEMENT =====

// Get all reading passages
exports.getPassages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    
    // Xây dựng query tìm kiếm
    let searchQuery = {};
    let sortQuery = {};
    
    // Tìm kiếm theo từ khóa
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      searchQuery.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { author: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Lọc theo ngày
    if (req.query.dateFrom || req.query.dateTo) {
      searchQuery.createdAt = {};
      if (req.query.dateFrom) {
        searchQuery.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        const dateTo = new Date(req.query.dateTo);
        dateTo.setHours(23, 59, 59, 999); // Cuối ngày
        searchQuery.createdAt.$lte = dateTo;
      }
    }
    
    // Sắp xếp
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'desc' ? -1 : 1;
    sortQuery[sortBy] = order;
    
    // Thực hiện truy vấn
    const passages = await ReadingPassage.find(searchQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username')
      .lean();
    
    // Đếm tổng số kết quả
    const totalPassages = await ReadingPassage.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalPassages / limit);
    
    // Thêm thông tin bổ sung cho mỗi passage
    const passagesWithStats = await Promise.all(passages.map(async (passage) => {
      // Đếm số câu hỏi
      const questionCount = await Question.countDocuments({ passageId: passage._id });
      
      // Đếm số từ (ước tính)
      const wordCount = passage.content ? passage.content.split(/\s+/).length : 0;
      
      // Ước tính thời gian đọc (200 từ/phút)
      const readingTime = Math.ceil(wordCount / 200);
      
      // Đếm số lần sử dụng trong tests
      const usageCount = await Test.countDocuments({
        'passages.passageId': passage._id
      });
      
      return {
        ...passage,
        questionCount,
        wordCount,
        readingTime,
        usageCount
      };
    }));
    
    // Render trang với dữ liệu
    res.render('admin/passages/index', {
      title: 'Reading Passages',
      passages: passagesWithStats,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        next: page + 1,
        prev: page - 1
      },
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      order: req.query.order || 'asc',
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || '',
      totalResults: totalPassages
    });
    
  } catch (error) {
    console.error('Get passages error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Cannot load passages list: ' + error.message
    });
  }
};

exports.getCreatePassageForm = (req, res) => {
  res.render('admin/passages/create', {
    title: 'Create Reading Passage',
    passage: {}
  });
};

// Create passage
exports.createPassage = async (req, res) => {
  try {
    const { title, content } = req.body;
    console.log('Session user:', req.session.user);
    if (!req.session.user || !req.session.user.id) {
      console.error('User session missing or incomplete during passage creation');
      return res.status(401).render('admin/passages/create', {
        title: 'Create Reading Passage',
        passage: req.body,
        error: 'Authentication error: your session may have expired. Please try logging in again.'
      });
    }

    const passage = new ReadingPassage({
      title,
      content,
      createdBy: req.session.user.id
    });

    await passage.save();

    res.redirect('/admin/passages');
  } catch (error) {
    console.error('Create passage error:', error);
    res.status(500).render('admin/passages/create', {
      title: 'Create Reading Passage',
      passage: req.body,
      error: 'Failed to create reading passage: ' + error.message
    });
  }
};

// Edit passage form
exports.getEditPassageForm = async (req, res) => {
  try {
    const { passageId } = req.params;
    const passage = await ReadingPassage.findById(passageId);

    if (!passage) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Reading passage not found'
      });
    }

    res.render('admin/passages/edit', {
      title: 'Edit Reading Passage',
      passage
    });
  } catch (error) {
    console.error('Edit passage form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load reading passage'
    });
  }
};

// Update passage
exports.updatePassage = async (req, res) => {
  try {
    const { passageId } = req.params;
    const { title, content } = req.body;

    const passage = await ReadingPassage.findByIdAndUpdate(
      passageId,
      {
        title,
        content,
      },
      { new: true, runValidators: true }
    );

    if (!passage) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Reading passage not found'
      });
    }

    res.redirect('/admin/passages');
  } catch (error) {
    console.error('Update passage error:', error);
    res.status(500).render('admin/passages/edit', {
      title: 'Edit Reading Passage',
      passage: { ...req.body, _id: req.params.passageId },
      error: 'Failed to update reading passage'
    });
  }
};

// Delete passage
exports.deletePassage = async (req, res) => {
  try {
    const { passageId } = req.params;
    const testWithPassage = await Test.findOne({
      'passages.passageId': passageId
    });

    if (testWithPassage) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete passage that is used in tests'
      });
    }
    await Question.deleteMany({ passageId });
    await ReadingPassage.findByIdAndDelete(passageId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete passage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reading passage'
    });
  }
};

// View passage details with questions
exports.getPassageDetails = async (req, res) => {
  try {
    const { passageId } = req.params;
    const passage = await ReadingPassage.findById(passageId);

    if (!passage) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Reading passage not found'
      });
    }

    const questions = await Question.find({ passageId })
      .sort({ order: 1 });

    res.render('admin/passages/details', {
      title: passage.title,
      passage,
      questions
    });
  } catch (error) {
    console.error('Passage details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load passage details'
    });
  }
};

// ===== QUESTIONS MANAGEMENT =====

// Create question form
exports.getCreateQuestionForm = async (req, res) => {
  try {
    const { passageId } = req.params;
    const passage = await ReadingPassage.findById(passageId);
    
    if (!passage) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Reading passage not found'
      });
    }
    
    // Đếm số câu hỏi hiện có để xác định thứ tự mặc định
    const questionCount = await Question.countDocuments({ passageId });
    
    // Thêm 'short_answer' vào danh sách loại câu hỏi
    const questionTypes = [
      'multiple_choice', 
      'fill_blank', 
      'matching', 
      'true_false_not_given',
      'short_answer'
    ];
    
    res.render('admin/questions/create', {
      title: 'Create Question',
      passage,
      nextOrder: questionCount + 1,
      questionTypes
    });
  } catch (error) {
    console.error('Create question form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load question creation form'
    });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { 
      questionType, order, title, questionText, score, 
      options, correctAnswer, correctAnswers,
      blankStyle, acceptableAnswers, oneWordAnswers, blankOptions, blankAnswers,
      matchingHeadings, matchingParagraphs, wordLimit, acceptableShortAnswers,
      multipleAnswers, createMultiple, wordLimits
    } = req.body;
    
    console.log("Creating question with type:", questionType);
    console.log("Blank style:", blankStyle);
    console.log("typeof blankStyle:", typeof blankStyle);
    
    const passageId = req.params.passageId;
    
    console.log("Form Data:", req.body);
    console.log("Question Type:", questionType);
    
    // Chuẩn bị dữ liệu câu hỏi cơ bản
    const questionData = {
      passageId,
      questionType,
      questionText,
      title,
      score: parseInt(score, 10),
      order: parseInt(order, 10)
    };
    
    // Xử lý dữ liệu dựa trên loại câu hỏi
    switch (questionType) {
      case 'multiple_choice':
        // Xử lý options
        let processedOptions = [];
        
        if (Array.isArray(options)) {
          // Nếu options là mảng
          processedOptions = options.flatMap(opt => {
            // Kiểm tra xem option có chứa dấu phẩy không
            if (opt.includes(',')) {
              // Nếu có, tách nó thành nhiều options
              return opt.split(',').map(o => o.trim()).filter(o => o !== '');
            }
            // Nếu không, giữ nguyên
            return opt.trim();
          }).filter(opt => opt !== '');
        } else if (typeof options === 'string') {
          // Nếu options là chuỗi, tách nó
          processedOptions = options.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
        }
        
        // Kiểm tra xem có ít nhất 2 options không
        if (processedOptions.length < 2) {
          throw new Error('Multiple choice questions must have at least two options');
        }
        
        questionData.options = processedOptions;
        
        // Xử lý multipleAnswers
        questionData.multipleAnswers = multipleAnswers === 'on';
        
        // Xử lý correctAnswer
        let finalCorrectAnswer = [];
        
        // Kiểm tra correctAnswer
        if (correctAnswer) {
          if (Array.isArray(correctAnswer)) {
            // Nếu correctAnswer là mảng
            finalCorrectAnswer = correctAnswer.flatMap(ans => {
              // Kiểm tra xem answer có chứa dấu phẩy không
              if (ans.includes(',')) {
                // Nếu có, tách nó thành nhiều answers
                return ans.split(',').map(a => a.trim()).filter(a => a !== '' && a !== 'on');
              }
              // Nếu không, giữ nguyên
              return ans.trim() !== 'on' ? ans.trim() : [];
            }).filter(ans => ans !== '');
          } else if (typeof correctAnswer === 'string') {
            // Nếu correctAnswer là chuỗi và không phải 'on'
            if (correctAnswer !== 'on') {
              // Kiểm tra xem có chứa dấu phẩy không
              if (correctAnswer.includes(',')) {
                finalCorrectAnswer = correctAnswer.split(',').map(ans => ans.trim()).filter(ans => ans !== '');
              } else {
                finalCorrectAnswer = [correctAnswer.trim()];
              }
            } else {
              // Nếu là 'on', mặc định chọn option đầu tiên
              finalCorrectAnswer = processedOptions.length > 0 ? [processedOptions[0]] : [];
            }
          }
        } 
        // Kiểm tra correctAnswers nếu không có correctAnswer
        else if (correctAnswers) {
          if (Array.isArray(correctAnswers)) {
            finalCorrectAnswer = correctAnswers.flatMap(ans => {
              if (ans.includes(',')) {
                return ans.split(',').map(a => a.trim()).filter(a => a !== '');
              }
              return ans.trim();
            }).filter(ans => ans !== '');
          } else if (typeof correctAnswers === 'string') {
            finalCorrectAnswer = correctAnswers.split(',').map(ans => ans.trim()).filter(ans => ans !== '');
          }
        }
        
        // Nếu không có đáp án nào được chọn, mặc định chọn đáp án đầu tiên
        if (finalCorrectAnswer.length === 0 && processedOptions.length > 0) {
          finalCorrectAnswer = [processedOptions[0]];
        }
        
        // Kiểm tra xem các đáp án có nằm trong danh sách options không
        finalCorrectAnswer = finalCorrectAnswer.filter(ans => 
          processedOptions.includes(ans)
        );
        
        // Nếu không phải multiple answers, chỉ lấy phần tử đầu tiên
        if (!questionData.multipleAnswers && finalCorrectAnswer.length > 0) {
          questionData.correctAnswer = finalCorrectAnswer[0];
        } else {
          questionData.correctAnswer = finalCorrectAnswer;
        }
        
        console.log("Processed options:", processedOptions);
        console.log("Final correctAnswer:", questionData.correctAnswer);
        break;
        
      case 'fill_blank':
        questionData.blankStyle = blankStyle || 'simple';
        
        if (questionData.blankStyle === 'simple') {
          const acceptableAnswersArray = acceptableAnswers ? 
            (Array.isArray(acceptableAnswers) ? acceptableAnswers : acceptableAnswers.split(',').map(item => item.trim()).filter(item => item)) : [];
          questionData.acceptableAnswers = acceptableAnswersArray;
          questionData.correctAnswer = acceptableAnswersArray;
        } else if (questionData.blankStyle === 'multiple') {
          questionData.blankOptions = blankOptions ? 
            (Array.isArray(blankOptions) ? blankOptions : blankOptions.split(',').map(item => item.trim()).filter(item => item)) : [];
          
          const blankAnswersArray = blankAnswers ? 
            (Array.isArray(blankAnswers) ? blankAnswers : blankAnswers.split(',').map(item => item.trim()).filter(item => item)) : [];
          const blankNumbersArray = req.body.blankNumbers ? 
            (Array.isArray(req.body.blankNumbers) ? req.body.blankNumbers.map(num => parseInt(num, 10)) : [parseInt(req.body.blankNumbers, 10)]) : [];
          
          const correctAnswerObj = {};
          
          // Sử dụng số thứ tự từ blankNumbersArray thay vì index + 1
          blankAnswersArray.forEach((answer, index) => {
            const blankNumber = blankNumbersArray[index] || (index + 1);
            correctAnswerObj[blankNumber] = parseInt(answer);
          });
          
          questionData.correctAnswer = correctAnswerObj;
          
          // Tạo câu hỏi mà không validate trước, sau đó sẽ cập nhật
          const newQuestion = new Question(questionData);
          await newQuestion.save({ validateBeforeSave: false });
          
          // Nếu đang tạo nhiều câu hỏi, trả về JSON response
          if (req.body.createMultiple === 'true') {
            return res.status(201).json({
              success: true,
              questionId: newQuestion._id,
              message: 'Question created successfully'
            });
          }
          
          // Nếu không, chuyển hướng như bình thường
          return res.redirect(`/admin/passages/${passageId}`);
        } else if (questionData.blankStyle === 'one_word_only') {
          console.log("Processing one_word_only style");
          console.log("req.body.oneWordAnswers:", req.body.oneWordAnswers);
          
          // Xử lý oneWordAnswers
          let oneWordAnswersArray = [];
          if (req.body.oneWordAnswers) {
            if (Array.isArray(req.body.oneWordAnswers)) {
              oneWordAnswersArray = req.body.oneWordAnswers.filter(ans => ans && ans.trim() && ans.trim() !== 'one');
            } else {
              oneWordAnswersArray = [req.body.oneWordAnswers].filter(ans => ans && ans.trim() && ans.trim() !== 'one');
            }
          }
          
          console.log("Processed oneWordAnswersArray:", oneWordAnswersArray);
          
          // Xử lý wordLimits, đảm bảo có cùng số lượng với oneWordAnswers
          let wordLimitsArray = [];
          if (req.body.wordLimits) {
            const rawLimits = Array.isArray(req.body.wordLimits) ? 
              req.body.wordLimits : [req.body.wordLimits];
            
            // Đảm bảo mỗi oneWordAnswer có một wordLimit tương ứng
            wordLimitsArray = oneWordAnswersArray.map((_, index) => {
              return index < rawLimits.length ? parseInt(rawLimits[index]) || 1 : 1;
            });
          } else {
            // Nếu không có wordLimits, mặc định là 1 cho mỗi câu trả lời
            wordLimitsArray = oneWordAnswersArray.map(() => 1);
          }
          
          // Thêm dữ liệu vào questionData
          questionData.oneWordAnswers = oneWordAnswersArray;
          questionData.wordLimits = wordLimitsArray;
          
          // Xử lý blank positions - ưu tiên blankPositions cho one_word_only
          let blankPositions = req.body.blankPositions;
          if (!blankPositions) {
            blankPositions = req.body.blankNumbers;
          }
          
          let blankNumbers = [];
          if (Array.isArray(blankPositions)) {
            blankNumbers = blankPositions.map(pos => parseInt(pos) || 1);
          } else if (blankPositions) {
            blankNumbers = [parseInt(blankPositions) || 1];
          } else {
            // Tạo blankNumbers tương ứng với oneWordAnswers (default là 1, 2, 3, ...)
            blankNumbers = oneWordAnswersArray.map((_, index) => index + 1);
          }
          
          // Đảm bảo blankNumbers có cùng length với oneWordAnswers
          while (blankNumbers.length < oneWordAnswersArray.length) {
            const maxPos = Math.max(...blankNumbers, 0);
            blankNumbers.push(maxPos + 1);
          }
          
          // Cắt bớt nếu blankNumbers dài hơn
          if (blankNumbers.length > oneWordAnswersArray.length) {
            blankNumbers = blankNumbers.slice(0, oneWordAnswersArray.length);
          }
          
          // Thêm blankNumbers vào questionData
          questionData.blankNumbers = blankNumbers;
          
          // Tạo correctAnswer cho one_word_only - sử dụng vị trí làm key
          const correctAnswerObj = {};
          oneWordAnswersArray.forEach((answer, index) => {
            const position = blankNumbers[index] || (index + 1);
            correctAnswerObj[position] = answer;
          });
          questionData.correctAnswer = correctAnswerObj;
          
          // Tạo câu hỏi
          const newQuestion = new Question(questionData);
          await newQuestion.save({ validateBeforeSave: false });
          
          // Nếu đang tạo nhiều câu hỏi, trả về JSON response
          if (req.body.createMultiple === 'true') {
            return res.status(201).json({
              success: true,
              questionId: newQuestion._id,
              message: 'Question created successfully'
            });
          }
          
          // Nếu không, chuyển hướng như bình thường
          return res.redirect(`/admin/passages/${passageId}`);
        }
        break;
        
      case 'matching':
        // Xử lý headings và paragraphs
        let headingsArray, paragraphsArray, matchingData;
        
        // Ưu tiên sử dụng dữ liệu JSON nếu có
        if (req.body.headings) {
          try {
            headingsArray = JSON.parse(req.body.headings);
          } catch (e) {
            headingsArray = req.body.matchingHeadings ? 
              (Array.isArray(req.body.matchingHeadings) ? 
                req.body.matchingHeadings.filter(h => h && h.trim()) : 
                [req.body.matchingHeadings].filter(h => h && h.trim())) : 
              [];
          }
        } else {
          headingsArray = req.body.matchingHeadings ? 
            (Array.isArray(req.body.matchingHeadings) ? 
              req.body.matchingHeadings.filter(h => h && h.trim()) : 
              [req.body.matchingHeadings].filter(h => h && h.trim())) : 
            [];
        }
        
        if (req.body.paragraphs) {
          try {
            paragraphsArray = JSON.parse(req.body.paragraphs);
          } catch (e) {
            paragraphsArray = req.body.matchingParagraphs ? 
              (Array.isArray(req.body.matchingParagraphs) ? 
                req.body.matchingParagraphs.filter(p => p && p.trim()) : 
                [req.body.matchingParagraphs].filter(p => p && p.trim())) : 
              [];
          }
        } else {
          paragraphsArray = req.body.matchingParagraphs ? 
            (Array.isArray(req.body.matchingParagraphs) ? 
              req.body.matchingParagraphs.filter(p => p && p.trim()) : 
              [req.body.matchingParagraphs].filter(p => p && p.trim())) : 
            [];
        }
        
        // Xử lý dữ liệu matching
        if (req.body.matchingData) {
          try {
            matchingData = JSON.parse(req.body.matchingData);
          } catch (e) {
            matchingData = { type: 'one_to_one', selections: {} };
          }
        } else {
          matchingData = { type: 'one_to_one', selections: {} };
        }
        
        questionData.matchingOptions = {
          headings: headingsArray,
          paragraphs: paragraphsArray,
          type: matchingData.type || 'one_to_one'
        };
        
        // Tạo câu hỏi không có correctAnswer trước
        delete questionData.correctAnswer;
        
        // Lưu câu hỏi vào database mà không validate
        const question = new Question(questionData);
        await question.save({ validateBeforeSave: false });
        
        // Xử lý correctAnswer dựa trên loại matching
        const correctAnswerObj = {};
        
        if (matchingData.selections) {
          for (const [paragraphIndex, value] of Object.entries(matchingData.selections)) {
            // Nếu là "not_used", bỏ qua
            if (value !== 'not_used') {
              correctAnswerObj[paragraphIndex] = value;
            }
          }
        }
        
        // Cập nhật correctAnswer trực tiếp vào database
        await Question.findByIdAndUpdate(question._id, { correctAnswer: correctAnswerObj });
        
        // Nếu đang tạo nhiều câu hỏi, trả về JSON response
        if (req.body.createMultiple === 'true') {
          return res.status(201).json({
            success: true,
            questionId: question._id,
            message: 'Question created successfully'
          });
        }
        
        // Nếu không, chuyển hướng như bình thường
        return res.redirect(`/admin/passages/${passageId}`);
      case 'true_false_not_given':
        // Model yêu cầu lowercase values
        let tfAnswer;
        if (correctAnswer) {
          const lowerAnswer = correctAnswer.toLowerCase();
          if (lowerAnswer === 'true') {
            tfAnswer = 'true';
          } else if (lowerAnswer === 'false') {
            tfAnswer = 'false';
          } else if (lowerAnswer === 'not given' || lowerAnswer === 'not_given') {
            tfAnswer = 'not_given';
          } else {
            console.log('Invalid true/false answer:', correctAnswer);
            tfAnswer = 'true'; // Giá trị mặc định
          }
        } else {
          tfAnswer = 'true'; // Giá trị mặc định
        }
        
        questionData.correctAnswer = tfAnswer;
        break;
        
      case 'short_answer':
        questionData.wordLimit = parseInt(req.body.wordLimit) || 10;
        
        // Xử lý acceptableShortAnswers
        if (req.body.acceptableShortAnswers) {
          if (Array.isArray(req.body.acceptableShortAnswers)) {
            questionData.acceptableShortAnswers = req.body.acceptableShortAnswers
              .filter(ans => ans.trim())
              .map(ans => ans.trim());
          } else {
            // Nếu là chuỗi, tách bằng dấu phẩy
            questionData.acceptableShortAnswers = req.body.acceptableShortAnswers
              .split(',')
              .map(ans => ans.trim())
              .filter(ans => ans);
          }
        } else {
          questionData.acceptableShortAnswers = [];
        }
        
        // Đảm bảo correctAnswer luôn là mảng
        questionData.correctAnswer = questionData.acceptableShortAnswers;
        
        break;
    }
    
    console.log("Final question data:", questionData);
    
    // Kiểm tra dữ liệu trước khi lưu
    if (questionType === 'multiple_choice') {
      if (!questionData.options || questionData.options.length < 2) {
        throw new Error('Multiple choice questions must have at least two options');
      }
      
      if (!questionData.correctAnswer || 
          (Array.isArray(questionData.correctAnswer) && questionData.correctAnswer.length === 0) ||
          questionData.correctAnswer === '') {
        throw new Error('Correct answer is required');
      }
    }
    
    // Tạo câu hỏi mới
    const question = new Question(questionData);
    await question.save();
    
    // Thay vì redirect, render lại trang với thông báo thành công
    const passage = await ReadingPassage.findById(req.params.passageId);
    const nextOrder = await getNextQuestionOrder(req.params.passageId);

    return res.status(201).render('admin/questions/create', {
      title: 'Create Question',
      passage,
      nextOrder,
      success: 'Question created successfully'
    });
    
  } catch (error) {
    console.error('Error creating question:', error);
    
    const passage = await ReadingPassage.findById(req.params.passageId);
    const nextOrder = await getNextQuestionOrder(req.params.passageId);
    
    return res.status(400).render('admin/questions/create', {
      passage,
      nextOrder,
      error: error.message || 'Cannot create question'
    });
  }
};

// Get edit question form
exports.getEditQuestionForm = async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const question = await Question.findById(questionId).populate('passageId');
    
    if (!question) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Question not found'
      });
    }

    const passage = question.passageId;
    if (!passage) {
      return res.status(404).render('error', {
        title: 'Error', 
        message: 'Passage not found'
      });
    }



    res.render('admin/questions/edit', {
      title: 'Edit Question',
      question,
      passage,
      success: req.query.success || null,
      error: req.query.error || null
    });

  } catch (error) {
    console.error('Get edit question error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load edit question form'
    });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      questionType,
      questionText,
      title,
      score,
      order,
      options,
      correctAnswer,
      multipleAnswers,
      // Fill in the blank fields
      blankStyle,
      acceptableAnswers,
      blankOptions,
      blankNumbers,
      blankAnswers,
      oneWordAnswers,
      wordLimit,
      // Matching fields
      matchingType,
      matchingHeadings,
      matchingParagraphs,
      matchingData,
      // Short answer fields
      oneWordOnly,
      acceptableShortAnswers
    } = req.body;

    console.log('Request body:', req.body);
    console.log('Question type:', questionType);

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Question not found'
      });
    }

    // Cập nhật thông tin cơ bản
    question.questionType = questionType;
    question.questionText = questionText;
    question.title = title || '';
    question.score = parseFloat(score);
    question.order = parseInt(order);

    // Reset các trường không cần thiết
    question.options = undefined;
    question.multipleAnswers = undefined;
    question.correctAnswer = undefined;
    question.blankStyle = undefined;
    question.acceptableAnswers = undefined;
    question.blankOptions = undefined;
    question.blanks = undefined;
    question.oneWordAnswers = undefined;
    question.wordLimit = undefined;
    question.matchingType = undefined;
    question.headings = undefined;
    question.paragraphs = undefined;
    question.matchingOptions = undefined;
    question.oneWordOnly = undefined;
    question.acceptableShortAnswers = undefined;

    // Xử lý theo loại câu hỏi
    if (questionType === 'multiple_choice') {
      question.options = Array.isArray(options) ? options.filter(opt => opt && opt.trim()) : [];
      question.multipleAnswers = multipleAnswers === 'true';
      
      // Xử lý correctAnswer cho multiple choice
      if (question.multipleAnswers) {
        // Với multiple answers, correctAnswer sẽ là mảng
        if (Array.isArray(correctAnswer)) {
          question.correctAnswer = correctAnswer.filter(answer => answer && answer.trim() !== '');
        } else if (correctAnswer) {
          question.correctAnswer = [correctAnswer];
        } else {
          question.correctAnswer = [];
        }
      } else {
        // Với single answer, correctAnswer sẽ là string
        question.correctAnswer = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
      }
      
      console.log('Final correctAnswer:', question.correctAnswer);
    }
    
    else if (questionType === 'fill_blank') {
      question.blankStyle = blankStyle || 'simple';
      
      if (blankStyle === 'simple') {
        // Simple blank - chỉ có acceptableAnswers
        question.acceptableAnswers = Array.isArray(acceptableAnswers) 
          ? acceptableAnswers.filter(answer => answer && answer.trim())
          : (acceptableAnswers ? [acceptableAnswers] : []);
      }
      else if (blankStyle === 'multiple') {
        // Multiple blank - có blankOptions và blanks
        question.blankOptions = Array.isArray(blankOptions) 
          ? blankOptions.filter(opt => opt && opt.trim())
          : [];
        
        // Xử lý blanks với số thứ tự và đáp án
        if (Array.isArray(blankNumbers) && Array.isArray(blankAnswers)) {
          // Tạo array blanks để lưu thông tin chi tiết
          question.blanks = blankNumbers.map((num, index) => ({
            number: parseInt(num),
            answer: parseInt(blankAnswers[index])
          })).filter(blank => !isNaN(blank.number) && !isNaN(blank.answer));
          
          // Tạo correctAnswer object với vị trí blank là key và index đáp án là value
          const correctAnswerObj = {};
          question.blanks.forEach(blank => {
            correctAnswerObj[blank.number] = blank.answer;
          });
          question.correctAnswer = correctAnswerObj;
        }
      }
      else if (blankStyle === 'one_word_only') {
        // One word only - có oneWordAnswers và wordLimit
        if (Array.isArray(oneWordAnswers)) {
          // Giữ lại tất cả các phần tử, kể cả rỗng, để duy trì thứ tự
          question.oneWordAnswers = oneWordAnswers.map(answer => answer || '');
        } else {
          question.oneWordAnswers = oneWordAnswers ? [oneWordAnswers] : [''];
        }
        
        // Xử lý word limits - đảm bảo length khớp với oneWordAnswers
        if (Array.isArray(wordLimit)) {
          question.wordLimits = wordLimit.map(limit => parseInt(limit) || 1);
        } else {
          question.wordLimits = [parseInt(wordLimit) || 1];
        }
        
        // Đảm bảo wordLimits có cùng length với oneWordAnswers
        const oneWordAnswersLength = (question.oneWordAnswers || []).length;
        while (question.wordLimits.length < oneWordAnswersLength) {
          question.wordLimits.push(1);
        }
        
        // Cắt bớt nếu wordLimits dài hơn
        if (question.wordLimits.length > oneWordAnswersLength) {
          question.wordLimits = question.wordLimits.slice(0, oneWordAnswersLength);
        }
        
        // Xử lý blank positions - ưu tiên blankPositions cho one_word_only
        let blankPositions = req.body.blankPositions;
        if (!blankPositions) {
          blankPositions = req.body.blankNumbers;
        }
        
        if (Array.isArray(blankPositions)) {
          question.blankNumbers = blankPositions.map(pos => parseInt(pos) || 1);
        } else if (blankPositions) {
          question.blankNumbers = [parseInt(blankPositions) || 1];
        } else {
          // Tạo blankNumbers tương ứng với oneWordAnswers (default là 1, 2, 3, ...)
          question.blankNumbers = (question.oneWordAnswers || []).map((_, index) => index + 1);
        }
        
        // Đảm bảo blankNumbers có cùng length với oneWordAnswers
        const oneWordAnswersArray = question.oneWordAnswers || [];
        while (question.blankNumbers.length < oneWordAnswersArray.length) {
          const maxPos = Math.max(...question.blankNumbers, 0);
          question.blankNumbers.push(maxPos + 1);
        }
        
        // Cắt bớt nếu blankNumbers dài hơn
        if (question.blankNumbers.length > oneWordAnswersArray.length) {
          question.blankNumbers = question.blankNumbers.slice(0, oneWordAnswersArray.length);
        }
        
        // Tạo correctAnswer cho one_word_only - sử dụng vị trí làm key
        const correctAnswerObj = {};
        oneWordAnswersArray.forEach((answer, index) => {
          const position = question.blankNumbers[index] || (index + 1);
          correctAnswerObj[position] = answer;
        });
        question.correctAnswer = correctAnswerObj;
      }
    }
    
    else if (questionType === 'matching') {
      question.matchingType = matchingType || 'one_to_one';
      
      // Lưu headings và paragraphs vào matchingOptions
      question.matchingOptions = {
        headings: Array.isArray(matchingHeadings)
          ? matchingHeadings.filter(heading => heading && heading.trim())
          : [],
        paragraphs: Array.isArray(matchingParagraphs)
          ? matchingParagraphs.filter(paragraph => paragraph && paragraph.trim())
          : []
      };
      
      // Xử lý matching data
      if (matchingData) {
        try {
          const parsedMatchingData = typeof matchingData === 'string' 
            ? JSON.parse(matchingData) 
            : matchingData;
          question.correctAnswer = parsedMatchingData;
        } catch (e) {
          console.error('Error parsing matching data:', e);
          question.correctAnswer = {};
        }
      }
    }
    
    else if (questionType === 'true_false_not_given') {
      // Đơn giản chỉ lưu correctAnswer
      question.correctAnswer = correctAnswer;
    }
    
    else if (questionType === 'short_answer') {
      question.oneWordOnly = oneWordOnly === 'true';
      question.wordLimit = parseInt(wordLimit) || 10;
      
      // Lưu các đáp án chấp nhận được
      if (Array.isArray(acceptableShortAnswers)) {
        question.acceptableShortAnswers = acceptableShortAnswers.filter(answer => answer && answer.trim());
      } else if (typeof acceptableShortAnswers === 'string' && acceptableShortAnswers.trim()) {
        question.acceptableShortAnswers = [acceptableShortAnswers.trim()];
      } else {
        question.acceptableShortAnswers = [];
      }
      
      // Đặt correctAnswer là acceptableShortAnswers để đáp ứng validation của model
      question.correctAnswer = question.acceptableShortAnswers;
      
      // Validation: đảm bảo có ít nhất một đáp án
      if (!question.acceptableShortAnswers || question.acceptableShortAnswers.length === 0) {
        throw new Error('Short answer questions must have at least one acceptable answer');
      }
    }

    console.log('Before save - oneWordAnswers:', question.oneWordAnswers);
    console.log('Before save - wordLimits:', question.wordLimits);
    console.log('Before save - matchingOptions:', question.matchingOptions);
    console.log('Before save - questionType:', question.questionType);
    
    await question.save();
    
    console.log('After save - oneWordAnswers:', question.oneWordAnswers);
    console.log('After save - wordLimits:', question.wordLimits);
    console.log('After save - matchingOptions:', question.matchingOptions);
    
    // Verify the question was actually saved by fetching it again
    const savedQuestion = await Question.findById(question._id);
    console.log('Verified saved - matchingOptions:', savedQuestion.matchingOptions);
    console.log('Verified saved - correctAnswer:', savedQuestion.correctAnswer);
    
    res.redirect(`/admin/passages/${question.passageId}?success=Câu hỏi đã được cập nhật thành công`);
  } catch (error) {
    console.error('Update question error:', error);
    
    try {
      const question = await Question.findById(req.params.questionId).populate('passageId');
      const passage = question ? question.passageId : null;
      
      res.status(500).render('admin/questions/edit', {
        title: 'Edit Question',
        question: question || req.body,
        passage,
        error: 'Đã xảy ra lỗi khi cập nhật câu hỏi: ' + error.message
      });
    } catch (renderError) {
      console.error('Render error:', renderError);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Đã xảy ra lỗi khi cập nhật câu hỏi'
      });
    }
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const testWithQuestion = await Test.findOne({
      'passages.questions': questionId
    });

    if (testWithQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question that is used in tests'
      });
    }

    const result = await Question.findByIdAndDelete(questionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
};

// ===== TESTS MANAGEMENT =====

exports.getTests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    
    // Xây dựng query tìm kiếm
    let searchQuery = {};
    let sortQuery = {};
    
    // Tìm kiếm theo từ khóa
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      searchQuery.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Lọc theo điểm số tối thiểu
    if (req.query.minScore && !isNaN(req.query.minScore)) {
      searchQuery.totalScore = { ...searchQuery.totalScore, $gte: parseInt(req.query.minScore) };
    }
    
    // Lọc theo thời gian tối đa
    if (req.query.maxTime && !isNaN(req.query.maxTime)) {
      searchQuery.timeLimit = { ...searchQuery.timeLimit, $lte: parseInt(req.query.maxTime) };
    }
    
    // Sắp xếp
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'desc' ? -1 : 1;
    sortQuery[sortBy] = order;
    
    // Thực hiện truy vấn
    const tests = await Test.find(searchQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username')
      .lean();
    
    // Đếm tổng số kết quả
    const totalTests = await Test.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalTests / limit);
    
    // Thêm thông tin bổ sung cho mỗi test
    const testsWithStats = tests.map(test => {
      // Tính số câu hỏi
      const questionCount = test.passages.reduce((total, passage) => {
        return total + (passage.questions ? passage.questions.length : 0);
      }, 0);
      
      return {
        ...test,
        questionCount
      };
    });
    
    // Render trang với dữ liệu
    res.render('admin/tests/index', {
      title: 'Tests',
      tests: testsWithStats,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        next: page + 1,
        prev: page - 1
      },
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      order: req.query.order || 'asc',
      minScore: req.query.minScore || '',
      maxTime: req.query.maxTime || '',
      totalResults: totalTests
    });
    
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load tests'
    });
  }
};

// Create test form
exports.getCreateTestForm = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    
    // Xây dựng query tìm kiếm
    let searchQuery = {};
    
    // Tìm kiếm theo từ khóa
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      searchQuery.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Sắp xếp
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'desc' ? -1 : 1;
    const sortQuery = {};
    sortQuery[sortBy] = order;
    
    // Thực hiện truy vấn
    const passages = await ReadingPassage.find(searchQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username')
      .lean();
    
    // Đếm tổng số kết quả
    const totalPassages = await ReadingPassage.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalPassages / limit);
    
    // Thêm thông tin số câu hỏi cho mỗi passage
    const passagesWithQuestions = await Promise.all(passages.map(async (passage) => {
      const questionCount = await Question.countDocuments({ passageId: passage._id });
      return {
        ...passage,
        questionCount
      };
    }));

    res.render('admin/tests/create', {
      title: 'Create Test',
      passages: passagesWithQuestions,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        next: page + 1,
        prev: page - 1
      },
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      order: req.query.order || 'asc',
      totalResults: totalPassages
    });
  } catch (error) {
    console.error('Create test form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test form'
    });
  }
};

// Get passage questions (AJAX)
exports.getPassageQuestions = async (req, res) => {
  try {
    const { passageId } = req.params;
    const { questionType } = req.query; // Thêm query parameter để lọc theo loại
    
    let query = { passageId };
    
    // Thêm filter theo loại câu hỏi nếu có
    if (questionType && questionType !== 'all') {
      query.questionType = questionType;
    }
    
    const questions = await Question.find(query)
      .sort({ order: 1 });
    
    res.json({
      success: true,
      questions,
      filteredBy: questionType || 'all'
    });
  } catch (error) {
    console.error('Get passage questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load questions'
    });
  }
};
// Create test
exports.createTest = async (req, res) => {
  try {
    const { title, timeLimit, passageIds, questionIds, questionTypeFilter } = req.body;

    if (!title || !timeLimit || !passageIds || !questionIds) {
      const passages = await ReadingPassage.find()
        .populate({
          path: 'questionCount',
          match: { questionCount: { $gt: 0 } }
        });
        
      return res.status(400).render('admin/tests/create', {
        title: 'Create Test',
        passages,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc',
      });
    }

    console.log('Session user in createTest:', req.session.user);
    if (!req.session.user || !req.session.user.id) {
      console.error('User session missing or incomplete during test creation');
      const passages = await ReadingPassage.find()
        .populate({
          path: 'questionCount',
          match: { questionCount: { $gt: 0 } }
        });
        
      return res.status(401).render('admin/tests/create', {
        title: 'Create Test',
        passages,
        error: 'Authentication error: The session may have expired. Please log in again.',
      });
    }

    const passageIdsArray = Array.isArray(passageIds) ? passageIds : [passageIds];
    const questionIdsObject = typeof questionIds === 'object' ? questionIds : JSON.parse(questionIds);
    
    // Lọc câu hỏi theo loại đã chọn nếu không phải "all"
    let filteredQuestionIds = questionIdsObject;
    if (questionTypeFilter && questionTypeFilter !== 'all') {
      filteredQuestionIds = {};
      
      for (const passageId of passageIdsArray) {
        const selectedQuestions = questionIdsObject[passageId] || [];
        
        // Lấy thông tin các câu hỏi để kiểm tra loại
        const questions = await Question.find({
          _id: { $in: selectedQuestions },
          questionType: questionTypeFilter
        });
        
        filteredQuestionIds[passageId] = questions.map(q => q._id.toString());
      }
      
      // Kiểm tra xem có câu hỏi nào phù hợp không
      const hasValidQuestions = Object.values(filteredQuestionIds).some(questions => questions.length > 0);
      if (!hasValidQuestions) {
        const passages = await ReadingPassage.find()
          .populate({
            path: 'questionCount',
            match: { questionCount: { $gt: 0 } }
          });
          
        return res.status(400).render('admin/tests/create', {
          title: 'Create Test',
          passages,
          error: `Không tìm thấy câu hỏi nào thuộc loại "${questionTypeFilter}" trong các bài đọc đã chọn.`,
        });
      }
      
      // Kiểm tra từng passage có ít nhất 1 câu hỏi phù hợp
      for (const passageId of passageIdsArray) {
        if (!filteredQuestionIds[passageId] || filteredQuestionIds[passageId].length === 0) {
          // Lấy tên passage để hiển thị lỗi cụ thể
          const passage = await ReadingPassage.findById(passageId);
          const passageName = passage ? passage.title : 'Unknown';
          
          const passages = await ReadingPassage.find()
            .populate({
              path: 'questionCount',
              match: { questionCount: { $gt: 0 } }
            });
            
          return res.status(400).render('admin/tests/create', {
            title: 'Create Test',
            passages,
            error: `Bài đọc "${passageName}" không có câu hỏi nào thuộc loại "${questionTypeFilter}". Vui lòng chọn "Tất cả" hoặc chọn bài đọc khác.`,
          });
        }
      }
    }
    
    const passages = passageIdsArray.map(passageId => ({
      passageId,
      questions: filteredQuestionIds[passageId] || []
    }));
    
    const questions = await Question.find({
      _id: { $in: Object.values(filteredQuestionIds).flat() }
    });
    
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 1), 0);

    const test = new Test({
      title,
      timeLimit: parseInt(timeLimit),
      questionTypeFilter: questionTypeFilter || 'all',
      passages,
      totalScore,
      createdBy: req.session.user.id
    });

    await test.save();
    
    res.redirect('/admin/tests');
  } catch (error) {
    console.error('Create test error:', error);
    
    const passages = await ReadingPassage.find()
      .populate({
        path: 'questionCount',
        match: { questionCount: { $gt: 0 } }
      });
      
    res.status(500).render('admin/tests/create', {
      title: 'Create Test',
      passages,
      error: 'An error occurred while creating the test: ' + error.message
    });
  }
};
// Thêm function này vào adminController.js
exports.getTestDetails = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId)
      .populate('passages.passageId')
      .populate('passages.questions')
      .populate('createdBy', 'username');
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test không tồn tại'
      });
    }

    // Lọc bỏ các passage có passageId null và tính tổng số câu hỏi và điểm
    let questionCount = 0;
    let totalScore = 0;
    
    // Lọc các passage hợp lệ và đảm bảo passageId không null
    test.passages = test.passages.filter(passage => {
      return passage.passageId !== null && passage.passageId !== undefined;
    });
    
    test.passages.forEach(passage => {
      if (passage.questions && Array.isArray(passage.questions)) {
        questionCount += passage.questions.length;
        passage.questions.forEach(question => {
          totalScore += question.score || 1;
        });
      }
    });

    // Thêm thông tin vào test object
    test.questionCount = questionCount;
    test.totalScore = totalScore;

    // Mock statistics
    const stats = {
      attemptCount: 0,
      avgScore: 0,
      avgPercentage: 0
    };

    res.render('admin/tests/details', {
      title: 'Test Detail',
      test,
      stats,
      success: req.query.success
    });
    
  } catch (error) {
    console.error('Get test detail error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while loading the test details'
    });
  }
};
// Edit test form
exports.getEditTestForm = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId)
      .populate('passages.passageId')
      .populate('passages.questions');
    
    if (!test) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test không tồn tại'
      });
    }

    const allPassages = await ReadingPassage.find().sort({ title: 1 });

    for (const passage of allPassages) {
      const questionCount = await Question.countDocuments({ passageId: passage._id });
      passage.questionCount = questionCount;
    }
    
    res.render('admin/tests/edit', {
      title: 'Edit Test',
      test,
      allPassages
    });
  } catch (error) {
    console.error('Edit test form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test edit form: ' + error.message
    });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { title, timeLimit, passageIds, questionIds } = req.body;

    console.log('Update test data:', { title, timeLimit, passageIds, questionIds });

    if (!title || !timeLimit || !passageIds || !questionIds) {
      const test = await Test.findById(testId)
        .populate('passages.passageId')
        .populate('passages.questions');
      
      const allPassages = await ReadingPassage.find().sort({ title: 1 });
      
      for (const passage of allPassages) {
        const questionCount = await Question.countDocuments({ passageId: passage._id });
        passage.questionCount = questionCount;
      }
      
      return res.status(400).render('admin/tests/edit', {
        title: 'Edit Test',
        test,
        allPassages,
        error: 'Please fill in all required information'
      });
    }

    const passageIdsArray = Array.isArray(passageIds) ? passageIds : [passageIds];
    let questionIdsObject;
    
    try {
      questionIdsObject = typeof questionIds === 'string' ? JSON.parse(questionIds) : questionIds;
    } catch (parseError) {
      console.error('Error parsing questionIds:', parseError);
      questionIdsObject = {};
    }
    
    console.log('Parsed questionIds:', questionIdsObject);
    
    const passages = passageIdsArray.map(passageId => ({
      passageId,
      questions: questionIdsObject[passageId] || []
    }));

    // Kiểm tra mỗi passage phải có ít nhất 1 câu hỏi
    const invalidPassage = passages.find(passage => 
      !passage.questions || passage.questions.length === 0
    );
    
    if (invalidPassage) {
      const test = await Test.findById(testId)
        .populate('passages.passageId')
        .populate('passages.questions');
      
      const allPassages = await ReadingPassage.find().sort({ title: 1 });
      
      for (const passage of allPassages) {
        const questionCount = await Question.countDocuments({ passageId: passage._id });
        passage.questionCount = questionCount;
      }
      
      return res.status(400).render('admin/tests/edit', {
        title: 'Edit Test',
        test,
        allPassages,
        error: 'Each passage must have at least one question'
      });
    }

    // Tính tổng điểm
    const allQuestionIds = passages.flatMap(passage => passage.questions);
    const questions = await Question.find({ _id: { $in: allQuestionIds } });
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 1), 0);

    console.log('Total score calculated:', totalScore);

    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      {
        title,
        timeLimit: parseInt(timeLimit),
        passages,
        totalScore
      },
      { new: true, runValidators: true }
    );

    if (!updatedTest) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Test không tồn tại'
      });
    }

    console.log('Test updated successfully:', updatedTest._id);
    res.redirect(`/admin/tests/${testId}/detail?success=${encodeURIComponent('Test đã được cập nhật thành công')}`);
    
  } catch (error) {
    console.error('Update test error:', error);
    res.render('admin/tests/edit', {
      title: 'Edit Test',
      test: req.body,
      passages: [],
      error: 'An error occurred while updating the test'
    });
  }
};
// Delete test
exports.deleteTest = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test không tồn tại'
      });
    }

    await Test.findByIdAndDelete(testId);
    
    res.json({
      success: true,
        message: 'Test deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the test'
    });
  }
};

// ===== TEST POOLS MANAGEMENT =====

// Get all test pools
exports.getTestPools = async (req, res) => {
  try {
    const pools = await TestPool.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username')
      .populate('tests', 'title');

    res.render('admin/pools/index', {
      title: 'Test Pools',
      pools
    });
  } catch (error) {
    console.error('Get test pools error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test pools'
    });
  }
};

// Hàm hiển thị form tạo test pool
exports.getCreateTestPoolForm = async (req, res) => {
  try {
    const tests = await Test.find()
      .sort({ difficulty: 1, createdAt: -1 })
      .select('title difficulty timeLimit');

    res.render('admin/pools/create', {
      title: 'Create Test Pool',
      tests,
      difficultyLevels: ['easy', 'medium', 'hard'],
      questionTypes: ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given']
    });
  } catch (error) {
    console.error('Create test pool form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test pool form'
    });
  }
};

// Cập nhật hàm tạo test pool
exports.createTestPool = async (req, res) => {
  try {
    const { name, poolType, tests, criteria } = req.body;

    if (!name) {
      const allTests = await Test.find()
        .sort({ createdAt: -1 })
        .select('title timeLimit');
      
      return res.status(400).render('admin/pools/create', {
        title: 'Create Test Pool',
        tests: allTests,
        questionTypes: ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given'],
        error: 'Pool name is required'
      });
    }

    console.log('Session user in createTestPool:', req.session.user);
    if (!req.session.user || !req.session.user.id) {
      console.error('User session missing or incomplete during test pool creation');
      return res.status(401).render('admin/pools/create', {
        title: 'Create Test Pool',
        error: 'Authentication error: your session may have expired. Please try logging in again.'
      });
    }

    let testsArray = [];
    let criteriaObj = {};

    if (poolType === 'specific') {
      testsArray = Array.isArray(tests) ? tests : tests ? [tests] : [];
      
      if (testsArray.length === 0) {
        const allTests = await Test.find()
          .sort({ createdAt: -1 })
          .select('title timeLimit');
        
        return res.status(400).render('admin/pools/create', {
          title: 'Create Test Pool',
          tests: allTests,
          questionTypes: ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given'],
          error: 'Please select at least one test for the pool'
        });
      }
    } else if (poolType === 'criteria') {
      // Parse passage and question counts
      if (criteria) {
        if (criteria.passageCount) {
          criteriaObj.passageCount = parseInt(criteria.passageCount);
        }
        
        if (criteria.questionCount) {
          criteriaObj.questionCount = parseInt(criteria.questionCount);
        }
        
        if (criteria.questionTypes) {
          criteriaObj.questionTypes = Array.isArray(criteria.questionTypes) 
            ? criteria.questionTypes 
            : [criteria.questionTypes];
        }
      }

      // Default values if not provided
      if (!criteriaObj.passageCount) criteriaObj.passageCount = 1;
      if (!criteriaObj.questionCount) criteriaObj.questionCount = 5;
      
      if (!criteriaObj.questionTypes || criteriaObj.questionTypes.length === 0) {
        criteriaObj.questionTypes = ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given'];
        console.log('Using default criteria (all question types)');
      }
    }

    const pool = new TestPool({
      name,
      tests: testsArray,
      criteria: criteriaObj,
      createdBy: req.session.user.id
    });

    await pool.save();
    res.redirect('/admin/pools');
  } catch (error) {
    console.error('Create test pool error:', error);
    
    const allTests = await Test.find()
      .sort({ createdAt: -1 })
      .select('title timeLimit');
    
    res.status(500).render('admin/pools/create', {
      title: 'Create Test Pool',
      tests: allTests,
      questionTypes: ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given'],
      error: 'Failed to create test pool: ' + error.message
    });
  }
};
exports.generateRandomTest = async (req, res) => {
  try {
    const { poolId } = req.params;
    
    // Tìm và populate pool để có thông tin đầy đủ
    const pool = await TestPool.findById(poolId);
    
    if (!pool) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Không tìm thấy Test pool'
      });
    }

    // Trường hợp 1: Pool có các test cụ thể - chọn một test ngẫu nhiên
    if (pool.tests && pool.tests.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.tests.length);
      const randomTestId = pool.tests[randomIndex];
      return res.redirect(`/admin/tests/${randomTestId}`);
    }
    
    // Trường hợp 2: Pool dựa trên tiêu chí - tạo test ngẫu nhiên
    if (!pool.criteria || !pool.criteria.passageCount || !pool.criteria.questionCount) {
      return res.status(400).render('error', {
        title: 'Error',
        message: 'Test pool does not have enough criteria to create a test'
      });
    }

    console.log("Test criteria:", {
      passageCount: pool.criteria.passageCount,
      questionCount: pool.criteria.questionCount,
      questionTypes: pool.criteria.questionTypes
    });

    // 1. Tìm các bài đọc có đủ số lượng câu hỏi phù hợp với tiêu chí
    const passagesWithEnoughQuestions = [];
    const allPassages = await ReadingPassage.find();
    
    for (const passage of allPassages) {
      let questionQuery = { passageId: passage._id };
      
      // Áp dụng tiêu chí về loại câu hỏi nếu có
      if (pool.criteria.questionTypes && pool.criteria.questionTypes.length > 0) {
        questionQuery.questionType = { $in: pool.criteria.questionTypes };
      }
      
      // Đếm số lượng câu hỏi thỏa mãn điều kiện
      const questionCount = await Question.countDocuments(questionQuery);
      
      // Chỉ chọn bài đọc có đủ số lượng câu hỏi theo tiêu chí
      if (questionCount >= pool.criteria.questionCount) {
        passagesWithEnoughQuestions.push(passage);
      }
    }
    
    // Kiểm tra xem có đủ bài đọc không
    if (passagesWithEnoughQuestions.length < pool.criteria.passageCount) {
      return res.status(400).render('error', {
        title: 'Error',
        message: `Not enough passages with ${pool.criteria.questionCount} questions. Found ${passagesWithEnoughQuestions.length} passages but need ${pool.criteria.passageCount}.`
      });
    }
    
    // 2. Chọn ngẫu nhiên đúng số lượng bài đọc theo tiêu chí
    const selectedPassages = [];
    const passagesCopy = [...passagesWithEnoughQuestions];
    
    // Đảm bảo chỉ chọn đúng số lượng bài đọc theo tiêu chí
    for (let i = 0; i < pool.criteria.passageCount; i++) {
      if (passagesCopy.length === 0) break;
      const randomIndex = Math.floor(Math.random() * passagesCopy.length);
      selectedPassages.push(passagesCopy[randomIndex]);
      passagesCopy.splice(randomIndex, 1); // Loại bỏ để tránh chọn trùng
    }
    
    // 3. Với mỗi bài đọc, chọn đúng số lượng câu hỏi theo tiêu chí
    const testPassages = [];
    let totalScore = 0;
    
    for (const passage of selectedPassages) {
      let questionQuery = { passageId: passage._id };
      
      // Áp dụng tiêu chí về loại câu hỏi nếu có
      if (pool.criteria.questionTypes && pool.criteria.questionTypes.length > 0) {
        questionQuery.questionType = { $in: pool.criteria.questionTypes };
      }
      
      // Lấy tất cả câu hỏi phù hợp
      const questions = await Question.find(questionQuery).sort({ order: 1 });
      
      // Chọn đúng số lượng câu hỏi theo tiêu chí
      let selectedQuestions = [];
      
      // Đảm bảo không chọn quá số lượng câu hỏi theo tiêu chí
      const questionCount = Math.min(pool.criteria.questionCount, questions.length);
      const questionsCopy = [...questions];
      
      for (let i = 0; i < questionCount; i++) {
        if (questionsCopy.length === 0) break;
        const randomIndex = Math.floor(Math.random() * questionsCopy.length);
        selectedQuestions.push(questionsCopy[randomIndex]);
        questionsCopy.splice(randomIndex, 1);
      }
      
      // Thêm bài đọc và câu hỏi đã chọn vào test
      testPassages.push({
        passageId: passage._id,
        questions: selectedQuestions.map(q => q._id)
      });
      
      // Tính tổng điểm
      totalScore += selectedQuestions.reduce((sum, q) => sum + (parseFloat(q.score) || 1), 0);
      
      console.log(`Selected passage "${passage.title}" with ${selectedQuestions.length} questions`);
    }
    
    // 4. Tạo bài kiểm tra mới
    const testTitle = `
      Test Generated on ${new Date().toLocaleDateString()}
      Pool: ${pool.name}
    `;
    const test = new Test({
      title: testTitle,
      timeLimit: 60, // Thời gian làm bài mặc định
      passages: testPassages,
      totalScore,
      createdBy: req.session.user.id,
      isRandomlyGenerated: true
    });
    
    await test.save();
    console.log(`Created test "${testTitle}" with ${testPassages.length} passages`);
    
    // Chuyển hướng đến trang chi tiết bài kiểm tra
    res.redirect(`/admin/tests/${test._id}`);
  } catch (error) {
    console.error('Generate random test error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while creating a random test: ' + error.message
    });
  }
};
// Delete test pool
exports.deleteTestPool = async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const result = await TestPool.findByIdAndDelete(poolId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Test pool not found'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete test pool error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test pool'
    });
  }
};

// ===== STATISTICS AND REPORTS ====
// Get test statistics
exports.getTestStatistics = async (req, res) => {
  try {
    const tests = await Test.find()
      .sort({ createdAt: -1 });

    const testStats = [];
    for (const test of tests) {
      const attempts = await UserAttempt.find({
        testId: test._id,
        completedAt: { $exists: true }
      });

      if (attempts.length > 0) {
        const avgScore = attempts.reduce((sum, att) => sum + att.score, 0) / attempts.length;
        const avgPercentage = avgScore / test.totalScore * 100;
        const highestScore = Math.max(...attempts.map(att => att.score));
        const lowestScore = Math.min(...attempts.map(att => att.score));
        const avgTime = attempts.reduce((sum, att) => sum + att.totalTime, 0) / attempts.length;

        testStats.push({
          test,
          attemptCount: attempts.length,
          avgScore: Math.round(avgScore * 10) / 10,
          avgPercentage: Math.round(avgPercentage * 10) / 10,
          highestScore,
          lowestScore,
          avgTime: Math.round(avgTime)
        });
      } else {
        testStats.push({
          test,
          attemptCount: 0,
          avgScore: 0,
          avgPercentage: 0,
          highestScore: 0,
          lowestScore: 0,
          avgTime: 0
        });
      }
    }

    res.render('admin/statistics/tests', {
      title: 'Test Statistics',
      testStats
    });
  } catch (error) {
    console.error('Test statistics error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load test statistics'
    });
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .sort({ username: 1 });
    
    const userStats = [];
    for (const user of users) {
      const attempts = await UserAttempt.find({
        userId: user._id,
        completedAt: { $exists: true }
      }).populate('testId', 'title totalScore');

      if (attempts.length > 0) {
        const avgPercentage = attempts.reduce((sum, att) => 
          sum + (att.score / att.testId.totalScore * 100), 0
        ) / attempts.length;
        
        const bestAttempt = attempts.reduce((best, att) => {
          const attPercentage = att.score / att.testId.totalScore * 100;
          return attPercentage > (best ? (best.score / best.testId.totalScore * 100) : 0) 
            ? att 
            : best;
        }, null);

        userStats.push({
          user,
          attemptCount: attempts.length,
          avgPercentage: Math.round(avgPercentage * 10) / 10,
          bestAttempt: bestAttempt ? {
            test: bestAttempt.testId.title,
            score: bestAttempt.score,
            maxScore: bestAttempt.testId.totalScore,
            percentage: Math.round(bestAttempt.score / bestAttempt.testId.totalScore * 1000) / 10
          } : null
        });
      } else {
        userStats.push({
          user,
          attemptCount: 0,
          avgPercentage: 0,
          bestAttempt: null
        });
      }
    }

    res.render('admin/statistics/users', {
      title: 'User Statistics',
      userStats
    });
  } catch (error) {
    console.error('User statistics error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load user statistics'
    });
  }
};

// Thêm function tìm kiếm AJAX cho real-time search
exports.searchPassages = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ passages: [] });
    }
    
    const passages = await ReadingPassage.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { author: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('title author createdAt')
    .limit(limit)
    .sort({ createdAt: -1 });
    
    res.json({ passages });
    
  } catch (error) {
    console.error('Search passages error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

