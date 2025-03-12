import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createPetition,
  getPetitions,
  getPetition,
  updatePetition,
  addComment
} from '../controllers/petitionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create a new petition
router.post('/', createPetition);

// Get all petitions (with filters)
router.get('/', getPetitions);

// Get a single petition
router.get('/:id', getPetition);

// Update a petition
router.patch('/:id', updatePetition);

// Add a comment to a petition
router.post('/:id/comments', addComment);

export default router;
