const express = require('express');
const router = express.Router();
const Petition = require('../models/Petition');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if user is admin or officer
const isAdminOrOfficer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'department_officer')) {
      return res.status(403).json({ error: 'Access denied. Only admins and officers can access this route.' });
    }
    req.user.role = user.role;
    req.user.department = user.department;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking user role' });
  }
};

// Get all petitions (admin and officers)
router.get('/', auth, isAdminOrOfficer, async (req, res) => {
  try {
    const {
      status,
      priority,
      department,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by priority
    if (priority) query.priority = priority;
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Department officers can only see their department's petitions
    if (req.user.role === 'department_officer') {
      const departmentKeywords = getDepartmentKeywords(req.user.department);
      query.$or = [
        { category: { $regex: departmentKeywords.join('|'), $options: 'i' } },
        { description: { $regex: departmentKeywords.join('|'), $options: 'i' } }
      ];
    } else if (department) {
      // Admin can filter by specific department
      const departmentKeywords = getDepartmentKeywords(department);
      query.$or = [
        { category: { $regex: departmentKeywords.join('|'), $options: 'i' } },
        { description: { $regex: departmentKeywords.join('|'), $options: 'i' } }
      ];
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const petitions = await Petition.find(query)
      .populate('creator', 'name mobile')
      .populate('assignedTo', 'name department')
      .populate('timeline.updatedBy', 'name department')
      .populate('comments.author', 'name department')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Petition.countDocuments(query);

    res.json({
      data: petitions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching petitions:', error);
    res.status(500).json({ error: 'Error fetching petitions' });
  }
});

// Get petition statistics (admin and officers)
router.get('/statistics', auth, isAdminOrOfficer, async (req, res) => {
  try {
    let query = {};
    
    // Department officers only see their department stats
    if (req.user.role === 'department_officer') {
      const departmentKeywords = getDepartmentKeywords(req.user.department);
      query.$or = [
        { category: { $regex: departmentKeywords.join('|'), $options: 'i' } },
        { description: { $regex: departmentKeywords.join('|'), $options: 'i' } }
      ];
    }

    const stats = await Petition.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
        }
      }
    ]);

    res.json({ data: stats[0] || {
      total: 0, new: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0,
      highPriority: 0, urgent: 0
    }});
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// Create a new petition
router.post('/', auth, async (req, res) => {
  try {
    const petition = new Petition({
      ...req.body,
      creator: req.user.id,
      status: 'new',
      timeline: [{
        status: 'new',
        updatedBy: req.user.id,
        comment: 'Petition created'
      }]
    });
    
    await petition.save();
    await petition.populate([
      { path: 'creator', select: 'name mobile' },
      { path: 'timeline.updatedBy', select: 'name department' }
    ]);
    
    res.status(201).json({ data: petition });
  } catch (error) {
    console.error('Error creating petition:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get petitions by department
router.get('/department/:department', auth, async (req, res) => {
  try {
    console.log('Department request received:', req.params.department);
    const department = req.params.department.toLowerCase();
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'department_officer' && user.role !== 'admin') {
      console.log('User is not authorized');
      return res.status(403).json({ error: 'Access denied' });
    }

    const departmentKeywords = getDepartmentKeywords(department);
    console.log('Department keywords:', departmentKeywords);

    const petitions = await Petition.find({
      $or: [
        { category: { $regex: departmentKeywords.join('|'), $options: 'i' } },
        { description: { $regex: departmentKeywords.join('|'), $options: 'i' } }
      ]
    })
    .populate('creator', 'name mobile')
    .populate('assignedTo', 'name department')
    .populate('timeline.updatedBy', 'name department')
    .sort({ createdAt: -1 });

    console.log('Found petitions:', petitions.length);
    res.json({ data: petitions });
  } catch (error) {
    console.error('Error fetching department petitions:', error);
    res.status(500).json({ error: 'Error fetching petitions' });
  }
});

// Update petition status
router.patch('/:id/status', auth, isAdminOrOfficer, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const petition = await Petition.findById(req.params.id);
    
    if (!petition) {
      return res.status(404).json({ error: 'Petition not found' });
    }

    await petition.updateStatus(status, req.user.id, comment);
    await petition.populate([
      { path: 'creator', select: 'name mobile' },
      { path: 'assignedTo', select: 'name department' },
      { path: 'timeline.updatedBy', select: 'name department' }
    ]);

    res.json({ data: petition });
  } catch (error) {
    console.error('Error updating petition status:', error);
    res.status(500).json({ error: 'Error updating petition status' });
  }
});

// Add comment to petition
router.post('/:id/comments', auth, isAdminOrOfficer, async (req, res) => {
  try {
    const { text } = req.body;
    const petition = await Petition.findById(req.params.id);
    
    if (!petition) {
      return res.status(404).json({ error: 'Petition not found' });
    }

    await petition.addComment(text, req.user.id);
    await petition.populate([
      { path: 'creator', select: 'name mobile' },
      { path: 'comments.author', select: 'name department' }
    ]);

    res.json({ data: petition });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error adding comment' });
  }
});

// Helper function to get department-specific keywords
function getDepartmentKeywords(department) {
  const departmentKeywords = {
    water: ['water', 'plumbing', 'pipe', 'drainage', 'sewage', 'leak'],
    electricity: ['electricity', 'power', 'electric', 'lighting', 'voltage', 'outage'],
    roads: ['road', 'street', 'traffic', 'pavement', 'pothole', 'highway'],
    sanitation: ['garbage', 'waste', 'cleaning', 'sanitation', 'trash', 'hygiene'],
    education: ['school', 'education', 'teaching', 'student', 'classroom', 'learning']
  };

  return departmentKeywords[department] || [department];
}



module.exports = router;
