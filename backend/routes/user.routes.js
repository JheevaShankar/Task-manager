const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/users
// @desc    Get all users (Super Admin only)
// @access  Private/Super Admin
router.get('/', authorize('SUPER_ADMIN'), userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', userController.getUser);

// @route   PUT /api/users/:id/preferences
// @desc    Update user preferences
// @access  Private
router.put('/:id/preferences', userController.updatePreferences);

// @route   PUT /api/users/:id/promote
// @desc    Promote user to manager
// @access  Private (SUPER_ADMIN only)
router.put('/:id/promote', userController.promoteToManager);

// @route   PUT /api/users/:id/demote
// @desc    Demote manager to team member
// @access  Private (SUPER_ADMIN only)
router.put('/:id/demote', userController.demoteToTeamMember);

module.exports = router;
