/**
 * View configuration
 * Handles EJS view engine and layout setup
 */

const path = require('path');
const expressLayouts = require('express-ejs-layouts');

module.exports = function(app) {
  // View engine setup
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  
  
  // Layout setup
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);
};