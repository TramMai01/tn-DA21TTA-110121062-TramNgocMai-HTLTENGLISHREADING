const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReadingPassageSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
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

// Virtual for counting questions related to this passage
ReadingPassageSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'passageId',
  count: true
});

// Make virtuals appear in JSON and Object outputs
ReadingPassageSchema.set('toJSON', { virtuals: true });
ReadingPassageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReadingPassage', ReadingPassageSchema);