import Petition from '../models/Petition.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

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
    // Only users can create petitions
    if (req.user.role !== 'user') {
      return res.status(403).json({
        error: 'Only users can create petitions'
      });
    }

    // Handle file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { title, description, category, priority } = req.body;
        
        // Create petition object
        const petitionData = {
          title,
          description,
          category,
          priority,
          creator: req.user._id,
          status: 'pending'
        };

        // Add image path if an image was uploaded
        if (req.file) {
          petitionData.image = req.file.path;
        }

        // Save petition to database
        const petition = new Petition(petitionData);
        await petition.save();

        // Populate creator details
        await petition.populate('creator', 'mobile');

        res.status(201).json({
          message: 'Petition created successfully',
          data: petition
        });
      } catch (error) {
        // Clean up uploaded file if there's an error
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        throw error;
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

// Update petition with role-based permissions
export const updatePetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        error: 'Petition not found'
      });
    }

    // Check update permissions
    const isCreator = petition.creator.toString() === req.user._id.toString();
    const isDepartmentOfficer = req.user.role === 'department_officer' && 
                               petition.category === req.user.department;

    if (!isCreator && !isDepartmentOfficer) {
      return res.status(403).json({
        error: 'You do not have permission to update this petition'
      });
    }

    // Department officers can only update status
    if (isDepartmentOfficer) {
      if (!req.body.status) {
        return res.status(400).json({
          error: 'Department officers can only update petition status'
        });
      }
      petition.status = req.body.status;
    } else if (isCreator) {
      // Creators can update certain fields
      const allowedUpdates = ['title', 'description', 'category', 'priority'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .forEach(key => petition[key] = req.body[key]);
    }

    // Add resolved date if status is changed to resolved
    if (req.body.status === 'resolved' && petition.status !== 'resolved') {
      petition.resolvedAt = new Date();
    }

    await petition.save();
    await petition.populate('creator', 'mobile');
    await petition.populate('assignedTo', 'mobile');

    res.json({
      message: 'Petition updated successfully',
      data: petition
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update petition: ' + error.message
    });
  }
};

// Add comment to petition
export const addComment = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        error: 'Petition not found'
      });
    }

    // Check comment permissions
    const isCreator = petition.creator.toString() === req.user._id.toString();
    const isDepartmentOfficer = req.user.role === 'department_officer' && 
                               petition.category === req.user.department;

    if (!isCreator && !isDepartmentOfficer) {
      return res.status(403).json({
        error: 'You do not have permission to comment on this petition'
      });
    }

    petition.comments.push({
      text: req.body.text,
      user: req.user._id,
      userRole: req.user.role
    });

    await petition.save();
    await petition.populate('comments.user', 'mobile');

    res.json({
      message: 'Comment added successfully',
      data: petition.comments[petition.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add comment: ' + error.message
    });
  }
};
