import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Regular user signup
export const signup = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      mobile,
      password,
      role: 'user'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          mobile: user.mobile,
          role: user.role
        }
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creating user: ' + error.message
    });
  }
};

// Department officer signup
export const officerSignup = async (req, res) => {
  try {
    const { name, mobile, password, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    // Create department officer
    const user = await User.create({
      name,
      mobile,
      password,
      department,
      role: 'department_officer'
    });

    res.status(201).json({
      message: 'Department officer created successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creating department officer: ' + error.message
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid mobile number or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid mobile number or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Logged in successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          department: user.department
        }
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error logging in: ' + error.message
    });
  }
};
