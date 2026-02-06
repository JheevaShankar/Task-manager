const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/notifications
// @desc    Get upcoming deadlines
// @access  Private
router.get('/', notificationController.getUpcomingDeadlines);

// @route   POST /api/notifications/send-reminder
// @desc    Manually trigger reminder for a task
// @access  Private
router.post('/send-reminder/:taskId', notificationController.sendReminder);

module.exports = router;
