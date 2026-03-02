import express from 'express';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { signToken } from '../utils/jwt.js';
import { getUserByEmail, createUser, emailExists } from '../models/userQueries.js';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth.js';

// Register a new user (customer or chef)
export const register = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fullName, email, password, role, chefBusinessName, phone } = req.body as RegisterRequest;

    // Validate required fields
    if (!fullName || !email || !password) {
      res.status(400).json({ success: false, message: 'fullName, email, and password are required' });
      return;
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    // Check if email already exists
    if (await emailExists(email)) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Default role is 'customer' if not specified
    const userRole = role || 'customer';

    // Validate chef-specific fields
    if (userRole === 'chef' && !chefBusinessName) {
      res.status(400).json({ success: false, message: 'chefBusinessName is required for chef role' });
      return;
    }

    // Hash password before storing
    const passwordHash = await hashPassword(password);

    // Create user in database
    const newUser = await createUser({
      fullName,
      email,
      passwordHash,
      role: userRole,
      chefBusinessName: userRole === 'chef' ? chefBusinessName : null,
      phone: phone || null,
      isActive: true,
    });

    // Generate JWT token
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return success response
    const response: AuthResponse = {
      success: true,
      message: `${userRole === 'chef' ? 'Chef' : 'Customer'} registered successfully`,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Login an existing user
export const login = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // Fetch user by email
    const user = await getUserByEmail(email);

    // Check if user exists
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is inactive' });
      return;
    }

    // Compare provided password with stored hash
    const passwordMatch = await comparePassword(password, user.passwordHash);

    if (!passwordMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return success response
    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get current user profile (requires authentication)
export const getProfile = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // User data is attached by authenticate middleware
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Fetch user from database
    const user = await getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Return user profile (exclude password hash)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        chefBusinessName: user.chefBusinessName,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Import getUserById for profile endpoint
import { getUserById } from '../models/userQueries.js';
