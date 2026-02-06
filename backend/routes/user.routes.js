const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authorize('admin'), userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', userController.getUser);

// @route   PUT /api/users/:id/preferences
// @desc    Update user preferences
// @access  Private
router.put('/:id/preferences', userController.updatePreferences);

module.exports = router;
