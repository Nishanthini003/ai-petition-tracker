import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Please log in to access this resource'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('_id mobile role');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists'
      });
    }

    // Grant access to protected route
    req.user = {
      _id: user._id,
      mobile: user.mobile,
      role: user.role
    };
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Please log in to access this resource'
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
