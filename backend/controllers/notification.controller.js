const Task = require('../models/Task.model');
const { sendDeadlineReminder } = require('../services/notification.service');

// @desc    Get upcoming deadlines
// @route   GET /api/notifications
// @access  Private
exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get tasks with deadlines in next 7 days
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Build query based on role
    const baseQuery = userRole === 'MANAGER'
      ? { assignedBy: userId }
      : { assignedTo: userId };

    const upcomingTasks = await Task.find({
      ...baseQuery,
      status: { $ne: 'Done' },
      deadline: {
        $gte: today,
        $lte: weekFromNow
      },
      isArchived: false
    })
    .sort({ deadline: 1 })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .select('title deadline priority status assignedTo assignedBy');

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
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Check if user has access to the task
    const userId = req.user._id.toString();
    const hasAccess = task.assignedBy._id.toString() === userId || 
                      task.assignedTo._id.toString() === userId;

    if (!hasAccess) {
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

// @desc    Get submission notifications for managers
// @route   GET /api/notifications/submissions
// @access  Private (Manager)
exports.getSubmissionNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'MANAGER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can access submission notifications'
      });
    }

    // Get pending submissions
    const pendingSubmissions = await Task.find({
      assignedBy: req.user._id,
      submissionStatus: 'Pending Review',
      isArchived: false
    })
    .sort({ submissionDate: -1 })
    .populate('assignedTo', 'name email')
    .select('title submissionDate assignedTo');

    // Get recently accepted/rejected submissions (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentReviews = await Task.find({
      assignedBy: req.user._id,
      submissionStatus: { $in: ['Accepted', 'Rejected'] },
      submissionDate: { $gte: weekAgo },
      isArchived: false
    })
    .sort({ submissionDate: -1 })
    .populate('assignedTo', 'name email')
    .select('title submissionDate submissionStatus assignedTo');

    res.status(200).json({
      status: 'success',
      data: {
        pendingCount: pendingSubmissions.length,
        pendingSubmissions,
        recentReviews
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get task status notifications for team members
// @route   GET /api/notifications/task-status
// @access  Private (Team Member)
exports.getTaskStatusNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'TEAM_MEMBER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only team members can access task status notifications'
      });
    }

    // Get tasks with feedback (accepted/rejected in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const taskUpdates = await Task.find({
      assignedTo: req.user._id,
      submissionStatus: { $in: ['Accepted', 'Rejected'] },
      submissionDate: { $gte: weekAgo },
      isArchived: false
    })
    .sort({ submissionDate: -1 })
    .populate('assignedBy', 'name email')
    .select('title submissionDate submissionStatus managerFeedback assignedBy');

    res.status(200).json({
      status: 'success',
      results: taskUpdates.length,
      data: {
        taskUpdates
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
