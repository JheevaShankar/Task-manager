const User = require('../models/User.model');
const Task = require('../models/Task.model');

// @desc    Get all team members (Manager only)
// @route   GET /api/team/members
// @access  Private (Manager)
exports.getTeamMembers = async (req, res) => {
  try {
    // Only managers can access this
    if (req.user.role !== 'MANAGER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can view team members'
      });
    }

    const teamMembers = await User.find({ role: 'TEAM_MEMBER' }).select('-password');

    res.status(200).json({
      status: 'success',
      results: teamMembers.length,
      data: {
        teamMembers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get team member performance (Manager only)
// @route   GET /api/team/members/:id/performance
// @access  Private (Manager)
exports.getTeamMemberPerformance = async (req, res) => {
  try {
    // Only managers can access this
    if (req.user.role !== 'MANAGER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can view team member performance'
      });
    }

    const teamMemberId = req.params.id;

    // Get all tasks assigned to this team member by the current manager
    const tasks = await Task.find({
      assignedBy: req.user._id,
      assignedTo: teamMemberId
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In-Progress').length;
    const todoTasks = tasks.filter(t => t.status === 'To-Do').length;

    // Calculate tasks completed before deadline
    const tasksCompletedBeforeDeadline = tasks.filter(t => 
      t.completedBeforeDeadline === true
    ).length;

    const tasksCompletedAfterDeadline = tasks.filter(t => 
      t.completedBeforeDeadline === false && t.status === 'Done'
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const onTimeRate = completedTasks > 0 ? (tasksCompletedBeforeDeadline / completedTasks) * 100 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        performance: {
          totalTasks,
          completedTasks,
          overdueTasks,
          inProgressTasks,
          todoTasks,
          tasksCompletedBeforeDeadline,
          tasksCompletedAfterDeadline,
          completionRate: completionRate.toFixed(2),
          onTimeRate: onTimeRate.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get manager's team overview (Manager only)
// @route   GET /api/team/overview
// @access  Private (Manager)
exports.getTeamOverview = async (req, res) => {
  try {
    // Only managers can access this
    if (req.user.role !== 'MANAGER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can view team overview'
      });
    }

    // Get all tasks created by this manager
    const allTasks = await Task.find({ assignedBy: req.user._id })
      .populate('assignedTo', 'name email');

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Done').length;
    const overdueTasks = allTasks.filter(t => t.status === 'Overdue').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'In-Progress').length;
    const todoTasks = allTasks.filter(t => t.status === 'To-Do').length;

    // Get team members count
    const teamMembers = await User.countDocuments({ role: 'TEAM_MEMBER' });

    // Tasks by priority
    const highPriorityTasks = allTasks.filter(t => t.priority === 'High').length;
    const mediumPriorityTasks = allTasks.filter(t => t.priority === 'Medium').length;
    const lowPriorityTasks = allTasks.filter(t => t.priority === 'Low').length;

    // Upcoming deadlines (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = allTasks.filter(t => 
      t.deadline && 
      new Date(t.deadline) >= now && 
      new Date(t.deadline) <= nextWeek &&
      t.status !== 'Done'
    ).length;

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalTasks,
          completedTasks,
          overdueTasks,
          inProgressTasks,
          todoTasks,
          teamMembers,
          highPriorityTasks,
          mediumPriorityTasks,
          lowPriorityTasks,
          upcomingDeadlines
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = exports;
