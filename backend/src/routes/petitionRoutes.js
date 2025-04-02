import express from 'express';
import { protect, officerOnly, adminOnly } from '../middleware/auth.js';
import {
  createPetition,
  getPetitions,
  getPetition,
  updatePetitionStatus,
  getDepartmentPetitions,
  getAllPetitions
} from '../controllers/petitionController.js';

const router = express.Router();

router.use(protect);
// Public routes (no authentication needed)
router.post('/', createPetition); // Anyone can create a petition
router.get('/all', getAllPetitions); // Only admins can view all petitions

// Protected routes (require authentication)

// Department officer-specific routes
router.patch('/:id/status', updatePetitionStatus); // Only officers can update status
router.get('/department', getDepartmentPetitions); // Only officers can view their dept petitions

// Admin-only routes

// General authenticated routes (available to all logged-in users)
router.get('/', getPetitions); // Filtered petitions based on user role
router.get('/:id', getPetition); // View single petition

export default router;