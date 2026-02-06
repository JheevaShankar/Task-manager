const User = require('../models/User.model');

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
