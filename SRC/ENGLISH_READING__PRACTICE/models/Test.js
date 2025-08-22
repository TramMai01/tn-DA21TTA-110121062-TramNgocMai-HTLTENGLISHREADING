const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TestSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Thêm trường để lưu loại câu hỏi được chọn
  questionTypeFilter: {
    type: String,
    enum: ['all', 'multiple_choice', 'fill_blank', 'matching', 'true_false_not_given', 'short_answer'],
    default: 'all'
  },
  timeLimit: {
    type: Number,
    default: 60 // Mặc định 60 phút
  },
  allowCustomTime: {
    type: Boolean,
    default: false // Cho phép người dùng tùy chỉnh thời gian
  },
  allowNoTimeLimit: {
    type: Boolean,
    default: false // Cho phép người dùng làm không giới hạn thời gian
  },
  passages: [{
    passageId: {
      type: Schema.Types.ObjectId,
      ref: 'ReadingPassage',
      required: true
    },
    questions: [{
      type: Schema.Types.ObjectId,
      ref: 'Question'
    }]
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual property to get total number of questions
TestSchema.virtual('questionCount').get(function() {
  return this.passages.reduce((total, passage) => total + passage.questions.length, 0);
});

// Pre-save validation to ensure test has at least one passage with questions
TestSchema.pre('save', async function(next) {
  if (!this.passages || this.passages.length === 0) {
    return next(new Error('Test must contain at least one passage'));
  }

  // Check if each passage has at least one question
  const invalidPassage = this.passages.find(passage => 
    !passage.questions || passage.questions.length === 0
  );
  
  if (invalidPassage) {
    return next(new Error('Each passage must have at least one question'));
  }

  // Validation cho questionTypeFilter nếu không phải 'all'
  if (this.questionTypeFilter && this.questionTypeFilter !== 'all') {
    const Question = require('./Question');
    
    // Lấy tất cả question IDs từ test
    const allQuestionIds = this.passages.flatMap(passage => passage.questions);
    
    // Kiểm tra xem có câu hỏi nào thuộc loại đã chọn không
    const questionsOfType = await Question.find({
      _id: { $in: allQuestionIds },
      questionType: this.questionTypeFilter
    });
    
    if (questionsOfType.length === 0) {
      return next(new Error(`Test must contain at least one question of type "${this.questionTypeFilter}"`));
    }
  }

  next();
});

// Make virtuals appear in JSON and Object outputs
TestSchema.set('toJSON', { virtuals: true });
TestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Test', TestSchema);