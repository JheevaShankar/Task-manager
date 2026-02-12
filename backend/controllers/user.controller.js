const User = require('../models/User.model');
const Department = require('../models/Department.model');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/:id/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    // Check if user is updating their own preferences
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update these preferences'
      });
    }

    const { emailNotifications, theme, defaultPriority } = req.body;

    const updateData = { preferences: {} };
    if (emailNotifications !== undefined) updateData.preferences.emailNotifications = emailNotifications;
    if (theme) updateData.preferences.theme = theme;
    if (defaultPriority) updateData.preferences.defaultPriority = defaultPriority;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Promote user to manager
// @route   PUT /api/users/:id/promote
// @access  Private (SUPER_ADMIN only)
exports.promoteToManager = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can promote users to Manager'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a department
    if (!user.department) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a department before being promoted'
      });
    }

    // Check if user is already a manager
    if (user.role === 'MANAGER') {
      return res.status(400).json({
        success: false,
        message: 'User is already a Manager'
      });
    }

    // Get the department
    const department = await Department.findById(user.department);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // If department already has a head, demote them to TEAM_MEMBER
    if (department.departmentHead) {
      const oldHead = await User.findById(department.departmentHead);
      if (oldHead) {
        oldHead.role = 'TEAM_MEMBER';
        await oldHead.save();
      }
    }

    // Promote user to MANAGER
    user.role = 'MANAGER';
    await user.save();

    // Update department head
    department.departmentHead = user._id;
    await department.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('department', 'name color');

    res.status(200).json({
      success: true,
      message: 'User promoted to Manager successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error promoting user',
      error: error.message
    });
  }
};

// @desc    Demote manager to team member
// @route   PUT /api/users/:id/demote
// @access  Private (SUPER_ADMIN only)
exports.demoteToTeamMember = async (req, res) => {
  try {
    // Check if user is SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can demote users'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a manager
    if (user.role !== 'MANAGER') {
      return res.status(400).json({
        success: false,
        message: 'User is not a Manager'
      });
    }

    // Demote user to TEAM_MEMBER
    user.role = 'TEAM_MEMBER';
    await user.save();

    // Remove as department head if applicable
    if (user.department) {
      await Department.findByIdAndUpdate(user.department, {
        departmentHead: null
      });
    }

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('department', 'name color');

    res.status(200).json({
      success: true,
      message: 'User demoted to Team Member successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error demoting user',
      error: error.message
    });
  }
};
