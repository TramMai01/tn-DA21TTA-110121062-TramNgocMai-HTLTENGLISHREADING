const path = require('path');
const { optionalAuth } = require('../middleware/auth');

module.exports = function(app) {
  // Import available route files
  const authRoutes = require('../routes/auth');
  const adminRoutes = require('../routes/admin');
  const userRoutes = require('../routes/user'); 

  // Middleware để truyền thông tin người dùng vào tất cả các views
  app.use(optionalAuth);

  // Apply routes
  app.use('/auth', authRoutes);
  app.use('/admin', adminRoutes);
  app.use('/user', userRoutes);

  // Home route
  app.get('/', (req, res) => {
    res.render('index', { 
      title: 'Reading Practice System'
    });
  });
  
  // 404 page not found - must be last
  app.use((req, res) => {
    res.status(404).render('error', {
      title: '404 - Page Not Found',
      message: 'The page you are looking for does not exist.'
    });
  });
};