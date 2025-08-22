/**
 * Configuration for method-override middleware
 * Allows HTML forms to use PUT, DELETE, etc. methods by using _method query parameter
 */

const methodOverride = require('method-override');

module.exports = function(app) {
  // Override with POST having ?_method=DELETE or ?_method=PUT
  app.use(methodOverride('_method'));
  
  // Override with header X-HTTP-Method-Override
  app.use(methodOverride('X-HTTP-Method-Override'));
  
  // Override with the custom header 'X-Method-Override'
  app.use(methodOverride('X-Method-Override'));
};