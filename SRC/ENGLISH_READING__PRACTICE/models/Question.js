const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  passageId: {
    type: Schema.Types.ObjectId,
    ref: 'ReadingPassage',
    required: [true, 'Reading passage reference is required']
  },
  title: {
    type: String,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given', 'short_answer'],
    required: [true, 'Question type is required']
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  // For multiple choice questions
  options: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.questionType !== 'multiple_choice' || (v && v.length >= 2);
      },
      message: 'Multiple choice questions must have at least two options'
    }
  },
  // For multiple choice questions with multiple correct answers
  multipleAnswers: {
    type: Boolean,
    default: false
  },
  // For fill in the blank questions - simple style
  acceptableAnswers: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.questionType !== 'fill_blank' || 
               this.blankStyle !== 'simple' || 
               (v && v.length >= 1);
      },
      message: 'Fill in the blank questions must have at least one acceptable answer'
    }
  },
  // For fill in the blank questions - style type
  blankStyle: {
    type: String,
    enum: ['simple', 'multiple', 'limited_words', 'one_word_only'],
    default: 'simple'
  },
  // For fill in the blank questions - multiple blanks with options
  blankOptions: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.questionType !== 'fill_blank' || 
               this.blankStyle !== 'multiple' || 
               (v && v.length >= 2);
      },
      message: 'Multiple blank questions must have at least two options'
    }
  },
  // For fill in the blank questions - one word only answers
  oneWordAnswers: {
    type: [String],
    set: function(value) {
      // Giữ nguyên tất cả giá trị, kể cả empty strings
      console.log('oneWordAnswers setter - input:', value);
      if (Array.isArray(value)) {
        const result = value.map(v => v === null || v === undefined ? '' : String(v));
        console.log('oneWordAnswers setter - output:', result);
        return result;
      }
      return value;
    },
    validate: {
      validator: function(v) {
        return this.questionType !== 'fill_blank' ||
               this.blankStyle !== 'one_word_only' ||
               (v && v.length >= 1);
      },
      message: 'One word only questions must have at least one answer specified'
    }
  },
  // For matching questions
  matchingOptions: {
    type: {
      headings: [String],
      paragraphs: [String]
    },
    validate: [
      function(v) {
        if (this.questionType !== 'matching') return true;
        return v && v.headings && v.headings.length > 0 && v.paragraphs && v.paragraphs.length > 0;
      },
      'Matching questions must have both headings and paragraphs'
    ]
  },
  // Correct answer varies by question type
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Correct answer is required'],
    validate: {
      validator: function(value) {
        switch (this.questionType) {
          case 'multiple_choice':
            if (this.multipleAnswers) {
              return Array.isArray(value) && value.length > 0;
            } else {
              return typeof value === 'string' && value.length > 0;
            }
          case 'true_false_not_given':
            return ['True', 'False', 'Not Given', 'true', 'false', 'not given', 'not_given'].includes(value);
          case 'fill_blank':
            if (this.blankStyle === 'multiple') {
              return typeof value === 'object' && value !== null && !Array.isArray(value);
            } else if (this.blankStyle === 'one_word_only') {
              return Array.isArray(value);
            } else {
              return Array.isArray(value) && value.length > 0;
            }
          case 'matching':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
          case 'short_answer':
            return Array.isArray(value) && value.length > 0;
          default:
            return true;
        }
      },
      message: 'Invalid correct answer format for the question type'
    }
  },
  score: {
    type: Number,
    required: [true, 'Question score is required'],
    min: [0, 'Score cannot be negative']
  },
  order: {
    type: Number,
    required: [true, 'Question order is required'],
    min: [1, 'Order must start from 1']
  },
  // Thêm trường mới cho câu hỏi trả lời ngắn
  wordLimit: {
    type: Number,
    validate: {
      validator: function(v) {
        return this.questionType !== 'short_answer' || (v && v > 0);
      },
      message: 'Short answer questions must specify a word limit'
    }
  },
  // Cho câu hỏi trả lời ngắn
  acceptableShortAnswers: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.questionType !== 'short_answer' || (v && v.length >= 1);
      },
      message: 'Short answer questions must have at least one acceptable answer'
    }
  },
  wordLimits: {
    type: [Number],
    validate: {
      validator: function(v) {
        // Bỏ qua validation khi không phải là fill_blank hoặc không phải one_word_only
        if (this.questionType !== 'fill_blank' || this.blankStyle !== 'one_word_only') {
          return true;
        }
        
        // Kiểm tra nếu không có oneWordAnswers thì luôn trả về true
        if (!this.oneWordAnswers || this.oneWordAnswers.length === 0) {
          return true;
        }
        
        // Đảm bảo số lượng word limits phải bằng số lượng answers
        return Array.isArray(v) && v.length === this.oneWordAnswers.length;
      },
      message: 'Word limits must match the number of answers'
    }
  },
  // Thêm trường blankNumbers vào schema
  blankNumbers: {
    type: [Number],
    validate: {
      validator: function(v) {
        return this.questionType !== 'fill_blank' ||
               this.blankStyle !== 'one_word_only' ||
               (Array.isArray(v) && v.length === this.oneWordAnswers.length);
      },
      message: 'Blank numbers must match the number of answers'
    }
  }
}, {
  timestamps: true
});

QuestionSchema.pre('save', function(next) {
  const question = this;
  
  switch(question.questionType) {
    case 'multiple_choice':
      if (!question.options || question.options.length < 2) {
        return next(new Error('Multiple choice questions must have at least two options'));
      }
      
      if (question.multipleAnswers) {
        // For multiple answer questions, correctAnswer should be an array of option values
        if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length < 1) {
          return next(new Error('Multiple answer questions must have at least one correct answer'));
        }
        
        // Verify all answers are valid options
        for (const answer of question.correctAnswer) {
          if (!question.options.includes(answer)) {
            return next(new Error(`Correct answer '${answer}' must be one of the options`));
          }
        }
      } else {
        // For single answer questions, correctAnswer should be a string
        if (typeof question.correctAnswer !== 'string' || !question.options.includes(question.correctAnswer)) {
          return next(new Error('Correct answer must be one of the options'));
        }
      }
      break;
    
    case 'fill_blank':
      if (question.blankStyle === 'multiple') {
        if (!question.blankOptions || question.blankOptions.length < 2) {
          return next(new Error('Multiple blank questions must have at least two options'));
        }
        
        if (typeof question.correctAnswer !== 'object' || Object.keys(question.correctAnswer).length < 1) {
          return next(new Error('Multiple blank questions must have at least one blank with a correct answer'));
        }
        const optionsCount = question.blankOptions.length;
        for (const blankNum in question.correctAnswer) {
          const answerIndex = question.correctAnswer[blankNum];
          if (answerIndex < 0 || answerIndex >= optionsCount) {
            return next(new Error(`Answer index ${answerIndex} for blank ${blankNum} is out of range`));
          }
        }
      } else if (question.blankStyle === 'one_word_only') {
        if (!question.oneWordAnswers || question.oneWordAnswers.length < 1) {
          return next(new Error('One word only questions must have at least one answer specified'));
        }
        
        // Validate that each non-empty answer respects the word limit
        const wordLimits = question.wordLimits || [];
        console.log("Word limits:", wordLimits);
        
        // Kiểm tra xem có ít nhất một đáp án không rỗng
        const hasValidAnswer = question.oneWordAnswers.some(answer => answer && answer.trim());
        if (!hasValidAnswer) {
          return next(new Error('One word only questions must have at least one non-empty answer'));
        }
        
        for (let i = 0; i < question.oneWordAnswers.length; i++) {
          const answer = question.oneWordAnswers[i];
          
          // Bỏ qua validation cho đáp án trống
          if (!answer || !answer.trim()) {
            console.log(`Skipping validation for empty answer at index ${i}`);
            continue;
          }
          
          // Đảm bảo wordLimit là một số
          const wordLimit = wordLimits[i] ? parseInt(wordLimits[i], 10) : 1;
          console.log(`Checking answer ${i}: "${answer}", word limit: ${wordLimit}`);
          
          // Handle multiple acceptable answers separated by commas
          const alternatives = answer.split(',').map(alt => alt.trim());
          
          for (const alt of alternatives) {
            if (!alt) continue; // Bỏ qua alternative rỗng
            
            const wordCount = alt.trim().split(/\s+/).length;
            console.log(`Alternative: "${alt}", word count: ${wordCount}`);
            
            if (wordCount > wordLimit) {
              return next(new Error(`Answer "${alt}" exceeds the word limit of ${wordLimit}`));
            }
          }
        }
        
        // Set the correctAnswer to be the oneWordAnswers (including empty ones for structure)
        question.correctAnswer = question.oneWordAnswers;
      } else if (question.blankStyle === 'simple') {
        if (!question.acceptableAnswers || question.acceptableAnswers.length < 1) {
          return next(new Error('Fill in the blank questions must have at least one acceptable answer'));
        }
      } else {
        // Default case for unknown blankStyle
        return next(new Error('Invalid blank style'));
      }
      break;
    
    case 'matching':
      if (!question.matchingOptions || 
          !question.matchingOptions.headings || 
          !question.matchingOptions.paragraphs ||
          question.matchingOptions.headings.length < 1 ||
          question.matchingOptions.paragraphs.length < 1) {
        return next(new Error('Matching questions must have both headings and paragraphs'));
      }
      break;
    
    case 'true_false_not_given':
      if (!['true', 'false', 'not_given'].includes(question.correctAnswer)) {
        return next(new Error('True/False/Not Given questions must have "true", "false", or "not_given" as the correct answer'));
      }
      break;
    
    case 'short_answer':
      if (!question.acceptableShortAnswers || question.acceptableShortAnswers.length < 1) {
        return next(new Error('Short answer questions must have at least one acceptable answer'));
      }
      
      if (!question.wordLimit || question.wordLimit <= 0) {
        return next(new Error('Short answer questions must specify a valid word limit'));
      }
      
      // Đảm bảo acceptableShortAnswers là một mảng
      if (!Array.isArray(question.acceptableShortAnswers)) {
        question.acceptableShortAnswers = [question.acceptableShortAnswers];
      }
      
      // Kiểm tra xem các đáp án có vượt quá giới hạn từ không
      for (const answer of question.acceptableShortAnswers) {
        const wordCount = answer.trim().split(/\s+/).length;
        if (wordCount > question.wordLimit) {
          return next(new Error(`Answer "${answer}" exceeds the word limit of ${question.wordLimit}`));
        }
      }
      
      // Đặt correctAnswer là acceptableShortAnswers
      question.correctAnswer = question.acceptableShortAnswers;
      break;
  }
  
  next();
});

// Method to check answer based on question type
QuestionSchema.methods.checkAnswer = function(userAnswer) {
  try {
    switch (this.questionType) {
      case 'multiple_choice':
        if (this.multipleAnswers) {
          // For multiple answer questions, userAnswer should be an array
          if (!Array.isArray(userAnswer) || userAnswer.length === 0) return false;
          
          // Check if user selected all and only the correct answers
          if (userAnswer.length !== this.correctAnswer.length) return false;
          
          // Make sure every user answer is in the correct answers
          return userAnswer.every(ans => this.correctAnswer.includes(ans));
        } else {
          return userAnswer === this.correctAnswer;
        }
      
      case 'fill_blank':
        if (this.blankStyle === 'multiple') {
          if (typeof userAnswer !== 'object') return false;
          
          const correctAnswers = this.correctAnswer;
          let allCorrect = true;
          
          for (const blank in correctAnswers) {
            if (userAnswer[blank] === undefined || parseInt(userAnswer[blank]) !== correctAnswers[blank]) {
              allCorrect = false;
              break;
            }
          }
          
          return allCorrect;
        } else if (this.blankStyle === 'limited_words') {
          // For one word only questions, we need to check each blank
          if (typeof userAnswer !== 'object') return false;
          
          const correctAnswers = this.correctAnswer; // This is already the oneWordAnswers array
          let allCorrect = true;
          let index = 0;
          
          for (const blank in userAnswer) {
            const userWord = userAnswer[blank].toLowerCase().trim();
            // Check if the user's answer for this blank matches the corresponding correct word
            // We allow case-insensitive matching for this type of question
            if (index < correctAnswers.length && userWord !== correctAnswers[index].toLowerCase().trim()) {
              allCorrect = false;
              break;
            }
            index++;
          }
          
          // Make sure all blanks were answered
          return allCorrect && index === correctAnswers.length;
        } else {
          const userAnswerLower = userAnswer.toLowerCase().trim();
          return this.acceptableAnswers.some(answer => 
            answer.toLowerCase().trim() === userAnswerLower
          );
        }
      
      case 'matching':
        if (typeof userAnswer !== 'object') return false;
        
        const correctMatches = this.correctAnswer;
        let allMatched = true;
        
        for (const paragraphIndex in correctMatches) {
          if (userAnswer[paragraphIndex] === undefined || 
              parseInt(userAnswer[paragraphIndex]) !== parseInt(correctMatches[paragraphIndex])) {
            allMatched = false;
            break;
          }
        }
        
        return allMatched;
      
      case 'true_false_not_given':
        return userAnswer === this.correctAnswer;
      
      case 'short_answer':
        const userAnswerLower = userAnswer.toLowerCase().trim();
        
        // Kiểm tra số từ
        const wordCount = userAnswerLower.split(/\s+/).length;
        if (wordCount > this.wordLimit) {
          return false; // Vượt quá giới hạn từ
        }
        
        // Kiểm tra xem có khớp với bất kỳ đáp án nào không
        return this.acceptableShortAnswers.some(answer => 
          answer.toLowerCase().trim() === userAnswerLower
        );
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking answer:', error);
    return false;
  }
};

// Tạm thời vô hiệu hóa validator
QuestionSchema.path('oneWordAnswers').validate(function(value) {
  return true; // Luôn trả về true để bỏ qua kiểm tra
}, 'Số từ trong mỗi đáp án không được vượt quá giới hạn đã đặt');

// Pre-save validation
QuestionSchema.pre('validate', function(next) {
  const question = this;
  
  console.log("In model validation - wordLimits:", question.wordLimits);
  console.log("In model validation - oneWordAnswers:", question.oneWordAnswers);
  
  // Validation based on question type
  switch(question.questionType) {
    // ... other question types ...
    
    case 'fill_blank':
      if (question.blankStyle === 'multiple') {
        // Validation for multiple choice blanks
        // ...
      } else if (question.blankStyle === 'one_word_only') {
        // Validation for one word only blanks
        if (!question.oneWordAnswers || question.oneWordAnswers.length < 1) {
          return next(new Error('One word only questions must have at least one answer specified'));
        }
        
        // ... word limit validation ...
        
        // Set the correctAnswer to be the oneWordAnswers
        question.correctAnswer = question.oneWordAnswers;
      } else if (question.blankStyle === 'simple') {
        if (!question.acceptableAnswers || question.acceptableAnswers.length < 1) {
          return next(new Error('Fill in the blank questions must have at least one acceptable answer'));
        }
      } else {
        // Default case for unknown blankStyle
        return next(new Error('Invalid blank style'));
      }
      break;
      
    // ... other question types ...
  }
  
  next();
});

module.exports = mongoose.model('Question', QuestionSchema);