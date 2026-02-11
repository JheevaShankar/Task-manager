const Task = require('../models/Task.model');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query based on role
    const baseQuery = userRole === 'MANAGER' 
      ? { assignedBy: userId, isArchived: false }
      : { assignedTo: userId, isArchived: false };

    // Get task counts
    const totalTasks = await Task.countDocuments(baseQuery);
    const completedTasks = await Task.countDocuments({ ...baseQuery, status: 'Done' });
    const inProgressTasks = await Task.countDocuments({ ...baseQuery, status: 'In-Progress' });
    const todoTasks = await Task.countDocuments({ ...baseQuery, status: 'To-Do' });

    // Get overdue tasks
    const overdueTasks = await Task.countDocuments({
      ...baseQuery,
      status: 'Overdue'
    });

    // Get high priority tasks
    const highPriorityTasks = await Task.countDocuments({
      ...baseQuery,
      priority: 'High',
      status: { $ne: 'Done' }
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          overdueTasks,
          highPriorityTasks,
          completionRate
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

// @desc    Get productivity metrics
// @route   GET /api/analytics/productivity
// @access  Private
exports.getProductivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = '7d' } = req.query;

    // Calculate date range
    const days = parseInt(period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query based on role
    const baseQuery = userRole === 'MANAGER' 
      ? { assignedBy: userId }
      : { assignedTo: userId };

    // Get completed tasks in period
    const completedTasks = await Task.find({
      ...baseQuery,
      status: 'Done',
      completedAt: { $gte: startDate },
      isArchived: false
    }).select('completedAt estimatedTime actualTime');

    // Calculate daily completion count
    const dailyCompletion = {};
    completedTasks.forEach(task => {
      const date = task.completedAt.toISOString().split('T')[0];
      dailyCompletion[date] = (dailyCompletion[date] || 0) + 1;
    });

    // Calculate average completion time
    const tasksWithTime = completedTasks.filter(t => t.actualTime);
    const avgCompletionTime = tasksWithTime.length > 0
      ? Math.round(tasksWithTime.reduce((sum, t) => sum + t.actualTime, 0) / tasksWithTime.length)
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        productivity: {
          period: `${days} days`,
          totalCompleted: completedTasks.length,
          dailyCompletion,
          avgCompletionTime
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

// @desc    Get priority distribution
// @route   GET /api/analytics/priority-distribution
// @access  Private
exports.getPriorityDistribution = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build match condition based on role
    const matchCondition = userRole === 'MANAGER'
      ? { assignedBy: userId, isArchived: false }
      : { assignedTo: userId, isArchived: false };

    const distribution = await Task.aggregate([
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      High: 0,
      Medium: 0,
      Low: 0
    };

    distribution.forEach(item => {
      result[item._id] = item.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        distribution: result
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get completion rate over time
// @route   GET /api/analytics/completion-rate
// @access  Private
exports.getCompletionRate = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = '30d' } = req.query;

    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query based on role
    const baseQuery = userRole === 'MANAGER'
      ? { assignedBy: userId }
      : { assignedTo: userId };

    // Get tasks created in period
    const tasks = await Task.find({
      ...baseQuery,
      createdAt: { $gte: startDate }
    }).select('createdAt status completedAt');

    // Group by week
    const weeklyData = {};
    tasks.forEach(task => {
      const week = getWeekNumber(task.createdAt);
      if (!weeklyData[week]) {
        weeklyData[week] = { total: 0, completed: 0 };
      }
      weeklyData[week].total++;
      if (task.status === 'Done') {
        weeklyData[week].completed++;
      }
    });

    // Calculate rates
    const completionRates = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      rate: Math.round((data.completed / data.total) * 100)
    }));

    res.status(200).json({
      status: 'success',
      data: {
        completionRates
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
}
