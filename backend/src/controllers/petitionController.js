import Petition from '../models/Petition.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/petitions/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).single('image');

// Create a new petition
export const createPetition = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { title, address, description, category, priority } = req.body;
        
        // Create petition object
        const petitionData = {
          title,
          description,
          address,
          category,
          priority,
          status: 'pending'
        };

        // Add creator if authenticated (optional)
        if (req.user?._id) {
          petitionData.creator = req.user._id;
        }

        // Add image path if uploaded
        if (req.file) {
          petitionData.image = req.file.path;
        }

        // Save to database
        const petition = new Petition(petitionData);
        await petition.save();

        // Populate creator if exists
        if (petition.creator) {
          await petition.populate('creator', 'name mobile');
        }

        res.status(201).json({
          message: 'Petition created successfully',
          data: petition
        });
      } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(400).json({ error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create petition: ' + error.message
    });
  }
};

// Get all petitions with visibility rules
export const getPetitions = async (req, res) => {
  try {
    const { category, status, limit = 10, page = 1 } = req.query;
    const query = {};

    // Apply visibility rules based on user role
    if (req.user.role === 'department_officer') {
      // Department officers can only see petitions from their department
      query.category = req.user.department;
    } else if (req.user.role === 'user') {
      // Regular users can only see their own petitions
      query.creator = req.user._id;
    }

    // Apply additional filters
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [petitions, total] = await Promise.all([
      Petition.find(query)
        .populate('creator', 'mobile')
        .populate('assignedTo', 'mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Petition.countDocuments(query)
    ]);

    res.json({
      data: petitions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching petitions: ' + error.message
    });
  }
};

// Get single petition with visibility check
export const getPetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('creator', 'mobile')
      .populate('assignedTo', 'mobile')
      .populate('comments.user', 'mobile');
    
    if (!petition) {
      return res.status(404).json({
        error: 'Petition not found'
      });
    }

    // Check visibility permissions
    const isCreator = petition.creator._id.toString() === req.user._id.toString();
    const isDepartmentOfficer = req.user.role === 'department_officer' && 
                               petition.category === req.user.department;

    if (!isCreator && !isDepartmentOfficer) {
      return res.status(403).json({
        error: 'You do not have permission to view this petition'
      });
    }

    res.json({ data: petition });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching petition: ' + error.message
    });
  }
};

export const updatePetitionStatus = async (req, res) => {
  try {
    const { status, userId } = req.body; // Now expecting userId in body
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const validStatuses = ['new', 'pending', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ error: 'Petition not found' });
    }

    // Bypass department check - INSECURE!
    const updatedPetition = await petition.updateStatus(status, userId);

    return res.status(200).json({
      success: true,
      data: {
        _id: updatedPetition._id,
        status: updatedPetition.status,
        updatedAt: updatedPetition.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};
export const getDepartmentPetitions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const officer = await User.findById(userId);
    console.log(officer);
    if (!officer || officer.role !== 'department_officer') {
      return res.status(403).json({ message: 'Access denied or invalid user' });
    }
    const petitions = await Petition.find({ category: officer.department });

    res.status(200).json({ message: "Petitions retrieved successfully", petitions });
  } catch (error) {
    console.error("Error fetching department petitions:", error);
    res.status(500).json({ message: 'Error fetching petitions', error });
  }
  
};

// petitionController.js
export const getAllPetitions = async (req, res) => {
  try {
    const petitions = await Petition.find();
    res.status(200).json({ message: "Petitions retrieved successfully", petitions });
  } catch (error) {
    console.error("Error fetching all petitions:", error);
    res.status(500).json({ message: 'Error fetching petitions', error });
  }
};