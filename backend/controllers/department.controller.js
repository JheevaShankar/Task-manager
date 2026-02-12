const Department = require('../models/Department.model');
const User = require('../models/User.model');
const Task = require('../models/Task.model');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (SUPER_ADMIN, MANAGER, TEAM_MEMBER)
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('departmentHead', 'name email')
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('departmentHead', 'name email role')
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get department statistics
    const taskCount = await Task.countDocuments({ department: department._id });
    const completedTasks = await Task.countDocuments({
      department: department._id,
      status: 'Done'
    });
    const pendingSubmissions = await Task.countDocuments({
      department: department._id,
      submissionStatus: 'Pending Review'
    });

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        stats: {
          totalTasks: taskCount,
          completedTasks,
          pendingSubmissions,
          memberCount: department.members.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message
    });
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (SUPER_ADMIN only)
exports.createDepartment = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create departments'
      });
    }

    const { name, description, color, departmentHead } = req.body;

    // Check if department already exists
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    // If departmentHead is provided, verify the user exists and update their role
    if (departmentHead) {
      const headUser = await User.findById(departmentHead);
      if (!headUser) {
        return res.status(404).json({
          success: false,
          message: 'Department head user not found'
        });
      }
      
      // Update user's role to MANAGER if not already
      if (headUser.role !== 'MANAGER' && headUser.role !== 'SUPER_ADMIN') {
        headUser.role = 'MANAGER';
        await headUser.save();
      }
    }

    const department = await Department.create({
      name,
      description,
      color: color || '#3b82f6',
      departmentHead: departmentHead || null,
      members: departmentHead ? [departmentHead] : [],
      createdBy: req.user._id
    });

    // Update department head's department field
    if (departmentHead) {
      await User.findByIdAndUpdate(departmentHead, {
        department: department._id,
        role: 'MANAGER'
      });
    }

    const populatedDept = await Department.findById(department._id)
      .populate('departmentHead', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: populatedDept
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (SUPER_ADMIN only)
exports.updateDepartment = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can update departments'
      });
    }

    const { name, description, color, departmentHead, isActive } = req.body;

    let department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // If changing department head
    if (departmentHead && departmentHead !== department.departmentHead?.toString()) {
      const newHead = await User.findById(departmentHead);
      if (!newHead) {
        return res.status(404).json({
          success: false,
          message: 'New department head not found'
        });
      }

      // Update old head's role if exists
      if (department.departmentHead) {
        const oldHead = await User.findById(department.departmentHead);
        if (oldHead) {
          oldHead.role = 'TEAM_MEMBER';
          oldHead.department = null;
          await oldHead.save();
        }
      }

      // Update new head's role and department
      newHead.role = 'MANAGER';
      newHead.department = department._id;
      await newHead.save();

      // Update members array
      if (!department.members.includes(departmentHead)) {
        department.members.push(departmentHead);
      }
    }

    // Update department fields
    if (name) department.name = name;
    if (description !== undefined) department.description = description;
    if (color) department.color = color;
    if (departmentHead !== undefined) department.departmentHead = departmentHead;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    const updatedDept = await Department.findById(department._id)
      .populate('departmentHead', 'name email role')
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDept
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message
    });
  }
};

// @desc    Add member to department
// @route   POST /api/departments/:id/members
// @access  Private (SUPER_ADMIN only)
exports.addMemberToDepartment = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can add members to departments'
      });
    }

    const { userId } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in department
    if (department.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this department'
      });
    }

    // Remove user from old department if exists
    if (user.department) {
      await Department.findByIdAndUpdate(user.department, {
        $pull: { members: userId }
      });
    }

    // Add to new department
    department.members.push(userId);
    await department.save();

    // Update user's department
    user.department = department._id;
    await user.save();

    const updatedDept = await Department.findById(department._id)
      .populate('departmentHead', 'name email role')
      .populate('members', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Member added to department successfully',
      data: updatedDept
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding member to department',
      error: error.message
    });
  }
};

// @desc    Remove member from department
// @route   DELETE /api/departments/:id/members/:userId
// @access  Private (SUPER_ADMIN only)
exports.removeMemberFromDepartment = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can remove members from departments'
      });
    }

    const { id: deptId, userId } = req.params;
    const department = await Department.findById(deptId);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Cannot remove department head this way
    if (department.departmentHead?.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove department head. Please assign a new head first.'
      });
    }

    // Remove from department
    department.members = department.members.filter(
      memberId => memberId.toString() !== userId
    );
    await department.save();

    // Update user's department
    await User.findByIdAndUpdate(userId, { department: null });

    const updatedDept = await Department.findById(deptId)
      .populate('departmentHead', 'name email role')
      .populate('members', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Member removed from department successfully',
      data: updatedDept
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing member from department',
      error: error.message
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (SUPER_ADMIN only)
exports.deleteDepartment = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can delete departments'
      });
    }

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has active tasks
    const taskCount = await Task.countDocuments({
      department: department._id,
      status: { $ne: 'Done' }
    });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${taskCount} active tasks. Please complete or reassign them first.`
      });
    }

    // Remove department reference from all members
    await User.updateMany(
      { department: department._id },
      { $set: { department: null, role: 'TEAM_MEMBER' } }
    );

    // Soft delete by setting isActive to false
    department.isActive = false;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message
    });
  }
};
