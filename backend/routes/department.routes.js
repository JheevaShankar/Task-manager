const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  addMemberToDepartment,
  removeMemberFromDepartment,
  deleteDepartment
} = require('../controllers/department.controller');
const { protect } = require('../middleware/auth.middleware');

// Public route - No authentication needed for registration
router.get('/', getAllDepartments);

// All other routes require authentication
router.use(protect);

// Department CRUD routes
router.route('/')
  .post(createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(updateDepartment)
  .delete(deleteDepartment);

// Member management routes
router.route('/:id/members')
  .post(addMemberToDepartment);

router.route('/:id/members/:userId')
  .delete(removeMemberFromDepartment);

module.exports = router;
