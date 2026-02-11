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

// @route   GET /api/notifications/submissions
// @desc    Get submission notifications for managers
// @access  Private (Manager)
router.get('/submissions', notificationController.getSubmissionNotifications);

// @route   GET /api/notifications/task-status
// @desc    Get task status notifications for team members
// @access  Private (Team Member)
router.get('/task-status', notificationController.getTaskStatusNotifications);

// @route   POST /api/notifications/send-reminder
// @desc    Manually trigger reminder for a task
// @access  Private
router.post('/send-reminder/:taskId', notificationController.sendReminder);

module.exports = router;
