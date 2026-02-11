const { validationResult } = require('express-validator');
const Task = require('../models/Task.model');
const { calculateAIPriority } = require('../services/ai-priority.service');

// Helper function to check and update overdue tasks
const checkOverdue = (task) => {
  if (task.deadline && task.status !== 'Done' && new Date() > new Date(task.deadline)) {
    task.status = 'Overdue';
  }
  return task;
};

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy } = req.query;

    // Build query based on role
    let query = { isArchived: false };

    if (req.user.role === 'MANAGER') {
      // Managers see all tasks they created
      query.assignedBy = req.user._id;
    } else {
      // Team members only see tasks assigned to them
      query.assignedTo = req.user._id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    let sort = {};
    if (sortBy === 'priority') {
      sort = { aiPriorityScore: -1, deadline: 1 };
    } else if (sortBy === 'deadline') {
      sort = { deadline: 1 };
    } else {
      sort = { createdAt: -1 };
    }

    let tasks = await Task.find(query)
      .sort(sort)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');

    // Check and update overdue tasks
    tasks = tasks.map(task => {
      checkOverdue(task);
      return task;
    });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Check authorization: Manager who created it or team member assigned to it
    const isManager = req.user.role === 'MANAGER' && task.assignedBy._id.toString() === req.user._id.toString();
    const isAssignedTeamMember = req.user.role === 'TEAM_MEMBER' && task.assignedTo._id.toString() === req.user._id.toString();

    if (!isManager && !isAssignedTeamMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this task'
      });
    }

    // Check and update overdue status
    checkOverdue(task);

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create new task (Manager only)
// @route   POST /api/tasks
// @access  Private (Manager)
exports.createTask = async (req, res) => {
  try {
    // Only managers can create tasks
    if (req.user.role !== 'MANAGER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can create tasks'
      });
    }

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    // Validate assignedTo is provided
    if (!req.body.assignedTo) {
      return res.status(400).json({
        status: 'error',
        message: 'Please assign this task to a team member'
      });
    }

    // Set user and assignedBy
    req.body.user = req.user._id;
    req.body.assignedBy = req.user._id;

    // Calculate AI priority
    const aiPriorityScore = await calculateAIPriority(req.body);
    req.body.aiPriorityScore = aiPriorityScore;

    // Auto-set priority based on AI score
    if (aiPriorityScore >= 75) {
      req.body.priority = 'High';
    } else if (aiPriorityScore >= 40) {
      req.body.priority = 'Medium';
    } else {
      req.body.priority = 'Low';
    }

    const task = await Task.create(req.body);
    await task.populate('assignedTo', 'name email role');
    await task.populate('assignedBy', 'name email role');

    res.status(201).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update task (Manager only)
// @route   PUT /api/tasks/:id
// @access  Private (Manager)
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only manager who created the task can update it
    if (req.user.role !== 'MANAGER' || task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the manager who created this task can update it'
      });
    }

    // Recalculate AI priority if certain fields changed
    if (req.body.deadline || req.body.category || req.body.estimatedTime) {
      const taskData = { ...task.toObject(), ...req.body };
      const aiPriorityScore = await calculateAIPriority(taskData);
      req.body.aiPriorityScore = aiPriorityScore;
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedTo', 'name email role').populate('assignedBy', 'name email role');

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete task (Manager only)
// @route   DELETE /api/tasks/:id
// @access  Private (Manager)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only manager who created the task can delete it
    if (req.user.role !== 'MANAGER' || task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the manager who created this task can delete it'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update task status (Team members can only update their assigned tasks)
// @route   PUT /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Team members can only update status of tasks assigned to them
    if (req.user.role === 'TEAM_MEMBER') {
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update tasks assigned to you'
        });
      }

      // Team members can only update status, not other fields
      // Prevent status updates to/from Overdue (system managed)
      if (status === 'Overdue' || task.status === 'Overdue') {
        return res.status(403).json({
          status: 'error',
          message: 'Cannot manually change overdue status'
        });
      }
    }

    // Managers can update status of tasks they created
    if (req.user.role === 'MANAGER' && task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update tasks you created'
      });
    }

    const oldStatus = task.status;
    task.status = status;

    // If task is marked as Done, record completion time
    if (status === 'Done' && oldStatus !== 'Done') {
      task.completedAt = new Date();
      
      // Check if completed before deadline
      if (task.deadline) {
        task.completedBeforeDeadline = new Date() <= new Date(task.deadline);
      }
    }

    await task.save();
    await task.populate('assignedTo', 'name email role');
    await task.populate('assignedBy', 'name email role');

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Recalculate AI priority
// @route   PUT /api/tasks/:id/priority
// @access  Private
exports.recalculatePriority = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Check if user owns the task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this task'
      });
    }

    const aiPriorityScore = await calculateAIPriority(task);
    task.aiPriorityScore = aiPriorityScore;

    // Update priority based on score
    if (aiPriorityScore >= 75) {
      task.priority = 'High';
    } else if (aiPriorityScore >= 40) {
      task.priority = 'Medium';
    } else {
      task.priority = 'Low';
    }

    await task.save();

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user._id,
      text
    });

    await task.save();

    // Populate the user info in the new comment
    await task.populate('comments.user', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update task order (for Kanban drag & drop)
// @route   PUT /api/tasks/bulk/update-order
// @access  Private
exports.updateTaskOrder = async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, status, order }

    // Update all tasks
    const updatePromises = tasks.map(async (taskUpdate) => {
      return Task.findByIdAndUpdate(
        taskUpdate.id,
        { status: taskUpdate.status },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      status: 'success',
      message: 'Task order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
