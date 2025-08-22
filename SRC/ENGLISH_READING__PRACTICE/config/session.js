/**
 * Session configuration
 * Handles Express session setup with MongoDB store
 */

const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = function(app) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'reading-practice-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/reading-practice',
      ttl: 14 * 24 * 60 * 60, // = 14 days
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    }
  }));

  // Set global variables for views
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
    next();
  });
};