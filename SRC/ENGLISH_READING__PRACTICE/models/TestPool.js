const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TestPoolSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Test pool name is required'],
    trim: true
  },
  tests: [{
    type: Schema.Types.ObjectId,
    ref: 'Test'
  }],
  criteria: {
    passageCount: {
      type: Number,
      min: 1,
      default: 1
    },
    questionCount: {
      type: Number,
      min: 1
    },
    questionTypes: [{
      type: String,
      enum: ['multiple_choice', 'fill_blank', 'matching', 'true_false_not_given']
    }]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  }
}, {
  timestamps: true
});

// Validate that the pool has tests or criteria for generating tests
TestPoolSchema.pre('save', function(next) {
  // Either tests array should have items or criteria should be defined
  if ((!this.tests || this.tests.length === 0) && 
      (!this.criteria || (!this.criteria.passageCount && (!this.criteria.questionTypes || this.criteria.questionTypes.length === 0)))) {
    return next(new Error('Test pool must either contain tests or have criteria for test generation'));
  }
  next();
});

// Method to get a random test from the pool
TestPoolSchema.methods.getRandomTest = function() {
  if (this.tests && this.tests.length > 0) {
    const randomIndex = Math.floor(Math.random() * this.tests.length);
    return this.tests[randomIndex];
  }
  return null;
};

// Static method to generate a new test from criteria
TestPoolSchema.methods.generateTest = async function(title = "Random Test") {
  if (!this.criteria) return null;
  
  try {
    // Find random passages based on criteria
    const query = {};
    
    // Find random questions matching the criteria
    let questionTypesQuery = {};
    if (this.criteria.questionTypes && this.criteria.questionTypes.length > 0) {
      questionTypesQuery = { questionType: { $in: this.criteria.questionTypes } };
    }
    
    // Find random passages
    const passageCount = this.criteria.passageCount || 1;
    const passages = await mongoose.model('ReadingPassage').aggregate([
      { $sample: { size: passageCount } }
    ]);
    
    if (!passages || passages.length === 0) {
      throw new Error('No passages found to generate test');
    }
    
    // Prepare test structure
    const testPassages = [];
    let totalScore = 0;
    
    // For each passage, get random questions
    for (const passage of passages) {
      // Get questions for this passage that match criteria
      const questionsForPassage = await mongoose.model('Question').find({
        passageId: passage._id,
        ...questionTypesQuery
      });
      
      // Determine how many questions to select
      const questionCountPerPassage = this.criteria.questionCount || 
        Math.min(5, questionsForPassage.length); // Default to 5 or all available
      
      // Randomly select questions
      const selectedQuestions = [];
      if (questionsForPassage.length > 0) {
        // Shuffle and pick questions
        const shuffled = [...questionsForPassage].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, questionCountPerPassage);
        
        // Add to selected questions and calculate score
        selected.forEach(q => {
          selectedQuestions.push(q._id);
          totalScore += (q.score || 1);
        });
      }
      
      // Add to test passages
      testPassages.push({
        passageId: passage._id,
        questions: selectedQuestions
      });
    }
    
    // Create new test
    const test = new mongoose.model('Test')({
      title,
      passages: testPassages,
      timeLimit: 60, // Default time limit
      totalScore,
      difficulty: 'medium', // Default difficulty
      createdBy: this.createdBy
    });
    
    await test.save();
    
    // Add to this pool's tests
    this.tests.push(test._id);
    await this.save();
    
    return test;
  } catch (error) {
    console.error('Test generation error:', error);
    return null;
  }
};

// Static method to find tests matching criteria
TestPoolSchema.statics.findTestsByCriteria = async function(criteria) {
  try {
    // First attempt to find tests that have any passages with questions of the required types
    const tests = await this.model('Test').find()
      .populate({
        path: 'passages.questions',
        match: criteria.questionTypes && criteria.questionTypes.length > 0 
          ? { questionType: { $in: criteria.questionTypes } }
          : {}
      });
    
    // Filter tests that have at least one matching question per passage
    return tests.filter(test => 
      test.passages.every(passage => passage.questions.length > 0)
    );
  } catch (error) {
    console.error('Error finding tests by criteria:', error);
    return [];
  }
};

module.exports = mongoose.model('TestPool', TestPoolSchema);