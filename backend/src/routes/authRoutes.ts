import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest, registerSchema, loginSchema } from '../middlewares/validation.js';

const router = express.Router();

// Public routes
// POST /api/auth/register - Register a new customer or chef
router.post('/register', validateRequest(registerSchema), register);

// POST /api/auth/login - Login with email and password
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
// GET /api/auth/profile - Get current user's profile (requires authentication)
router.get('/profile', authenticate, getProfile);

export default router;
