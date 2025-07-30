const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateProfile
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.post('/logout', auth, logoutUser);
router.put('/profile', auth, updateProfile);

module.exports = router;