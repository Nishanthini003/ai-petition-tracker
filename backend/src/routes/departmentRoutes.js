import express from 'express';
import { assignDepartment, getAllDepartmentOfficers } from '../controllers/departmentController.js';

const router = express.Router();

router.post('/assign-department', assignDepartment);
router.get('/officers', getAllDepartmentOfficers);

export default router;
