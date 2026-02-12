const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Department = require('../models/Department.model');

// Generate JWT Token with userId and role
const generateToken = (id, role) => {
  return jwt.sign(
    { 
      id,
      role 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // If department is provided, validate and check member limit
    let deptId = null;
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(404).json({
          status: 'error',
          message: 'Department not found'
        });
      }

      // Check if department is active
      if (!dept.isActive) {
        return res.status(400).json({
          status: 'error',
          message: 'This department is currently inactive'
        });
      }

      // Check member limit
      if (dept.members.length >= dept.maxMembers) {
        return res.status(400).json({
          status: 'error',
          message: `Department has reached maximum capacity (${dept.maxMembers} members)`
        });
      }

      deptId = dept._id;
    }

    // HARDCODED: JheevaShankar is ALWAYS SUPER_ADMIN
    let assignedRole;
    if (email === 'jheeva123@gmail.com') {
      assignedRole = 'SUPER_ADMIN';
      deptId = null; // Super admin doesn't belong to any department
    } else {
      // All new registrations are TEAM_MEMBER by default
      assignedRole = 'TEAM_MEMBER';
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      department: deptId
    });

    // Add user to department members if department was selected
    if (deptId) {
      await Department.findByIdAndUpdate(deptId, {
        $push: { members: user._id }
      });
    }

    // Populate department for response
    await user.populate('department', 'name color');

    // Generate token with userId and role
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // HARDCODED: Ensure jheeva123@gmail.com is ALWAYS SUPER_ADMIN
    if (user.email === 'jheeva123@gmail.com' && user.role !== 'SUPER_ADMIN') {
      user.role = 'SUPER_ADMIN';
      user.department = null; // Super admin has no department
      await user.save();
    }

    // Populate department info
    await user.populate('department', 'name color');

    // Generate token with userId and role
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name color');

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

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

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

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
