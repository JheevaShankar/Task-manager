const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', analyticsController.getOverview);

// @route   GET /api/analytics/productivity
// @desc    Get productivity metrics
// @access  Private
router.get('/productivity', analyticsController.getProductivity);

// @route   GET /api/analytics/priority-distribution
// @desc    Get priority distribution
// @access  Private
router.get('/priority-distribution', analyticsController.getPriorityDistribution);

// @route   GET /api/analytics/completion-rate
// @desc    Get completion rate over time
// @access  Private
router.get('/completion-rate', analyticsController.getCompletionRate);

module.exports = router;
