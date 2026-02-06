const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
router.get('/', taskController.getTasks);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', taskController.getTask);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', [
  body('title').notEmpty().withMessage('Title is required')
], taskController.createTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', taskController.updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', taskController.deleteTask);

// @route   PUT /api/tasks/:id/status
// @desc    Update task status
// @access  Private
router.put('/:id/status', taskController.updateTaskStatus);

// @route   PUT /api/tasks/:id/priority
// @desc    Recalculate AI priority
// @access  Private
router.put('/:id/priority', taskController.recalculatePriority);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', taskController.addComment);

// @route   PUT /api/tasks/bulk/update-order
// @desc    Update task order (for Kanban drag & drop)
// @access  Private
router.put('/bulk/update-order', taskController.updateTaskOrder);

module.exports = router;
