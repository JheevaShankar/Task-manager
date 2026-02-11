const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found. Please login again.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route. Invalid token.'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Require MANAGER role
exports.requireManager = (req, res, next) => {
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({
      status: 'error',
      message: 'Only managers can perform this action'
    });
  }
  next();
};

// Require TEAM_MEMBER role
exports.requireTeamMember = (req, res, next) => {
  if (req.user.role !== 'TEAM_MEMBER') {
    return res.status(403).json({
      status: 'error',
      message: 'Only team members can perform this action'
    });
  }
  next();
};
