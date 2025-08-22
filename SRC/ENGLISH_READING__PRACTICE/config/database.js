
const mongoose = require('mongoose');

module.exports = function() {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reading-practice', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
};