const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET routes
router.get('/login', authController.getLogin);
router.get('/register', authController.getRegisterForm);
router.get('/logout', authController.logout);
router.get('/verify/:token', authController.verifyAccount);

// POST routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

module.exports = router;