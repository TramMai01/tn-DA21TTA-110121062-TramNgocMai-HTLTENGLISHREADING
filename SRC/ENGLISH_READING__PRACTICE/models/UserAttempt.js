const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userAttemptSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [{
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question'
    },
    userAnswer: Schema.Types.Mixed,
    isCorrect: Boolean,
    score: Number
  }],
  score: {
    type: Number,
    default: 0
  },
  totalPossibleScore: {
    type: Number,
    default: 0
  },
  percentageScore: {
    type: Number,
    default: 0
  },
  ieltsScore: {
    type: Number,
    default: 0
  },
  ieltsScore40: {
    type: Number,
    default: 0
  },
  timeSpentInSeconds: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  }
}, { timestamps: true });

module.exports = mongoose.model('UserAttempt', userAttemptSchema);