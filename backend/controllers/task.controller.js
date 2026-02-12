const { validationResult } = require('express-validator');
const Task = require('../models/Task.model');

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

    // Build query based on role and department
    let query = { isArchived: false };

    if (req.user.role === 'SUPER_ADMIN') {
      // Super admin sees ALL tasks
      // No additional filter needed
    } else if (req.user.role === 'MANAGER') {
      // Managers see tasks from their department
      if (req.user.department) {
        query.department = req.user.department;
      } else {
        // If manager has no department, show tasks they assigned
        query.assignedBy = req.user._id;
      }
    } else {
      // Team members only see tasks assigned to them in their department
      query.assignedTo = req.user._id;
      if (req.user.department) {
        query.department = req.user.department;
      }
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
      sort = { deadline: 1 };
    } else if (sortBy === 'deadline') {
      sort = { deadline: 1 };
    } else {
      sort = { createdAt: -1 };
    }

    let tasks = await Task.find(query)
      .sort(sort)
      .populate('assignedTo', 'name email role department')
      .populate('assignedBy', 'name email role department')
      .populate('department', 'name color');

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
      .populate('assignedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('department', 'name color')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Check authorization: Super Admin, Manager who created it, or team member assigned to it
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isManager = req.user.role === 'MANAGER' && task.assignedBy._id.toString() === req.user._id.toString();
    const isAssignedTeamMember = req.user.role === 'TEAM_MEMBER' && task.assignedTo._id.toString() === req.user._id.toString();

    if (!isSuperAdmin && !isManager && !isAssignedTeamMember) {
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
    // Only managers and super admins can create tasks
    if (req.user.role !== 'MANAGER' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers and super admins can create tasks'
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
    
    // Automatically set department based on manager's department
    if (req.user.department) {
      req.body.department = req.user.department;
    }

    const task = await Task.create(req.body);
    await task.populate('assignedTo', 'name email role department');
    await task.populate('assignedBy', 'name email role department');
    await task.populate('department', 'name color');

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

    // Only super admin or manager who created the task can update it
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isTaskManager = req.user.role === 'MANAGER' && task.assignedBy.toString() === req.user._id.toString();
    
    if (!isSuperAdmin && !isTaskManager) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the manager who created this task can update it'
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('assignedTo', 'name email role department')
      .populate('assignedBy', 'name email role department')
      .populate('department', 'name color');

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

// @desc    Submit task solution (Team member)
// @route   POST /api/tasks/:id/submit
// @access  Private (Team Member)
exports.submitTaskSolution = async (req, res) => {
  try {
    const { submittedCode, submittedFiles } = req.body;

    // Validate that code or files are provided
    if (!submittedCode?.trim() && (!submittedFiles || submittedFiles.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide code or files before submitting'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only assigned team member can submit
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the assigned team member can submit this task'
      });
    }

    // Save previous submission to revision history if exists
    if (task.submittedCode || (task.submittedFiles && task.submittedFiles.length > 0)) {
      task.revisionHistory.push({
        submittedCode: task.submittedCode,
        submittedFiles: task.submittedFiles,
        submissionDate: task.submissionDate,
        status: task.submissionStatus,
        feedback: task.managerFeedback,
        reviewedAt: new Date()
      });
    }

    // Update task with new submission
    task.submittedCode = submittedCode || '';
    task.submittedFiles = submittedFiles || [];
    task.submissionStatus = 'Pending Review';
    task.submissionDate = new Date();
    task.managerFeedback = '';

    await task.save();
    await task.populate('assignedTo', 'name email role');
    await task.populate('assignedBy', 'name email role');

    res.status(200).json({
      status: 'success',
      message: 'Task submitted successfully',
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

// @desc    Get pending submissions (Manager)
// @route   GET /api/tasks/submissions/pending
// @access  Private (Manager)
exports.getPendingSubmissions = async (req, res) => {
  try {
    // Only managers can access this
    if (req.user.role !== 'MANAGER') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can view pending submissions'
      });
    }

    const pendingTasks = await Task.find({
      assignedBy: req.user._id,
      submissionStatus: 'Pending Review',
      isArchived: false
    })
      .sort({ submissionDate: -1 })
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');

    res.status(200).json({
      status: 'success',
      results: pendingTasks.length,
      data: {
        tasks: pendingTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Accept task submission (Manager)
// @route   PUT /api/tasks/:id/accept
// @access  Private (Manager)
exports.acceptSubmission = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only manager who created the task can accept
    if (req.user.role !== 'MANAGER' || task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the manager who created this task can accept it'
      });
    }

    // Check if task has a submission
    if (task.submissionStatus !== 'Pending Review') {
      return res.status(400).json({
        status: 'error',
        message: 'This task does not have a pending submission'
      });
    }

    // Accept the submission
    task.submissionStatus = 'Accepted';
    task.status = 'Done';
    task.completedAt = new Date();
    task.completedBeforeDeadline = task.deadline ? new Date() <= new Date(task.deadline) : null;
    task.managerFeedback = req.body.feedback || 'Accepted';

    await task.save();
    await task.populate('assignedTo', 'name email role');
    await task.populate('assignedBy', 'name email role');

    res.status(200).json({
      status: 'success',
      message: 'Task submission accepted',
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

// @desc    Reject task submission (Manager)
// @route   PUT /api/tasks/:id/reject
// @access  Private (Manager)
exports.rejectSubmission = async (req, res) => {
  try {
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide feedback for rejection'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only manager who created the task can reject
    if (req.user.role !== 'MANAGER' || task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the manager who created this task can reject it'
      });
    }

    // Check if task has a submission
    if (task.submissionStatus !== 'Pending Review') {
      return res.status(400).json({
        status: 'error',
        message: 'This task does not have a pending submission'
      });
    }

    // Save to revision history
    task.revisionHistory.push({
      submittedCode: task.submittedCode,
      submittedFiles: task.submittedFiles,
      submissionDate: task.submissionDate,
      status: 'Rejected',
      feedback: feedback,
      reviewedAt: new Date()
    });

    // Reject the submission
    task.submissionStatus = 'Rejected';
    task.status = 'In-Progress'; // Send back to in-progress
    task.managerFeedback = feedback;

    await task.save();
    await task.populate('assignedTo', 'name email role');
    await task.populate('assignedBy', 'name email role');

    res.status(200).json({
      status: 'success',
      message: 'Task submission rejected',
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
