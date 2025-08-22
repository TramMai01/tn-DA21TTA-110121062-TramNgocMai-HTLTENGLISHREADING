/**
 * Error handling configuration
 * Centralized error handling for the application
 */

module.exports = function(app) {
  // Global error handler middleware
  app.use((err, req, res, next) => {
    // Log error details to console
    console.error(err.stack);
    
    // Send error response
    res.status(500).render('error', {
      title: 'Error',
      message: 'Something went wrong on the server.',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });
};