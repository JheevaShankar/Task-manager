const { validationResult } = require('express-validator');
const Task = require('../models/Task.model');
const { calculateAIPriority } = require('../services/ai-priority.service');

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy } = req.query;

    // Build query
    const query = { user: req.user._id, isArchived: false };

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

    const tasks = await Task.find(query)
      .sort(sort)
      .populate('assignedTo', 'name email');

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
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

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
        message: 'Not authorized to access this task'
      });
    }

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

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    // Add user to task data
    req.body.user = req.user._id;

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

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

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

    // Recalculate AI priority if certain fields changed
    if (req.body.deadline || req.body.category || req.body.estimatedTime) {
      const taskData = { ...task.toObject(), ...req.body };
      const aiPriorityScore = await calculateAIPriority(taskData);
      req.body.aiPriorityScore = aiPriorityScore;
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
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
        message: 'Not authorized to delete this task'
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

// @desc    Update task status
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

    // Check if user owns the task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this task'
      });
    }

    task.status = status;
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
