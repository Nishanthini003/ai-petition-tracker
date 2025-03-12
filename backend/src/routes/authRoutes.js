import express from 'express';
import { signup, login, officerSignup } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/officer/signup', officerSignup);

export default router;
