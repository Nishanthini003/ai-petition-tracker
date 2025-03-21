import User from '../models/User.js';

export const assignDepartment = async (req, res) => {
  const { officerId, department } = req.body;

  try {
    const officer = await User.findById(officerId);

    if (!officer || officer.role !== 'department_officer') {
      return res.status(404).json({ message: 'Officer not found or not a department officer' });
    }

    if (!User.schema.path('department').enumValues.includes(department)) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    officer.department = department;
    await officer.save();

    res.status(200).json({ message: 'Department assigned successfully', officer });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning department', error });
  }
};

export const getAllDepartmentOfficers = async (req, res) => {
    try {
      const officers = await User.find({ role: 'department_officer' });
  
      res.status(200).json(officers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching officers', error });
    }
  };
  
