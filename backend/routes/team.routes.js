const express = require('express');
const teamController = require('../controllers/team.controller');
const { protect, requireManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and manager role
router.use(protect);
router.use(requireManager);

// @route   GET /api/team/members
// @desc    Get all team members
// @access  Private (Manager)
router.get('/members', teamController.getTeamMembers);

// @route   GET /api/team/members/:id/performance
// @desc    Get team member performance
// @access  Private (Manager)
router.get('/members/:id/performance', teamController.getTeamMemberPerformance);

// @route   GET /api/team/overview
// @desc    Get manager's team overview
// @access  Private (Manager)
router.get('/overview', teamController.getTeamOverview);

module.exports = router;
