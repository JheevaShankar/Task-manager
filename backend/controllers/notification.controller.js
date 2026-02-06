const Task = require('../models/Task.model');
const { sendDeadlineReminder } = require('../services/notification.service');

// @desc    Get upcoming deadlines
// @route   GET /api/notifications
// @access  Private
exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get tasks with deadlines in next 7 days
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const upcomingTasks = await Task.find({
      user: userId,
      status: { $ne: 'Done' },
      deadline: {
        $gte: today,
        $lte: weekFromNow
      },
      isArchived: false
    })
    .sort({ deadline: 1 })
    .select('title deadline priority status');

    res.status(200).json({
      status: 'success',
      results: upcomingTasks.length,
      data: {
        tasks: upcomingTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Manually send reminder for a task
// @route   POST /api/notifications/send-reminder/:taskId
// @access  Private
exports.sendReminder = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('user', 'name email');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Check if user owns the task
    if (task.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    await sendDeadlineReminder(task);

    res.status(200).json({
      status: 'success',
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
