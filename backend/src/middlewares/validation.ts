import { z, ZodError } from 'zod';
import express from 'express';

// Zod validation schemas for common requests

// Schema for user registration
export const registerSchema = z.object({
  fullName: z.string().min(2, 'fullName must be at least 2 characters').max(255),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'password must be at least 6 characters').max(100),
  role: z.enum(['customer', 'chef']).optional().default('customer'),
  chefBusinessName: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
});

// Schema for user login
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'password is required'),
});

// Schema for creating a subscription
export const createSubscriptionSchema = z.object({
  planName: z.string().min(1, 'planName is required').max(100),
  mealsPerWeek: z.number().int().min(1, 'mealsPerWeek must be at least 1'),
  priceInCents: z.number().int().min(0, 'priceInCents must be non-negative'),
  deliveryAddress: z.string().min(5, 'deliveryAddress is required').max(255),
  postalCode: z.string().min(3, 'postalCode is required').max(20),
  city: z.string().min(2, 'city is required').max(100),
});

// Schema for updating address
export const updateAddressSchema = z.object({
  deliveryAddress: z.string().min(5, 'deliveryAddress is required').max(255),
  postalCode: z.string().min(3, 'postalCode is required').max(20),
  city: z.string().min(2, 'city is required').max(100),
});

// Schema for swapping meal
export const swapMealSchema = z.object({
  newMealId: z.number().int().min(1, 'newMealId must be a valid number'),
});

// Schema for meal recommendations
export const recommendationSchema = z.object({
  userPreferences: z.object({
    dietType: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'keto', 'gluten-free']),
    healthGoal: z.enum(['weight-loss', 'muscle-gain', 'maintenance', 'energy', 'balanced']),
    allergies: z.array(z.string()).default([]),
    dislikedFoods: z.array(z.string()).default([]),
    mealHistory: z.array(z.string()).default([]),
  }),
});

// Schema for meal skip decision
export const skipDecisionSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner']),
  skipCount: z.number().int().min(0, 'skipCount must be non-negative'),
  healthGoal: z.enum(['weight-loss', 'muscle-gain', 'maintenance', 'energy', 'balanced']),
  subscriptionStatus: z.enum(['active', 'paused', 'cancelled']),
  consecutiveSkips: z.number().int().min(0).optional().default(0),
  lastMealTime: z.string().datetime().optional(),
});

// Validation middleware factory: Validates req.body against schema
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // Validate request body against Zod schema
      const validated = schema.parse(req.body);
      // Replace body with validated data (coerced types)
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract first error message for simplicity
        const message = error.errors[0]?.message || 'Validation error';
        return res.status(400).json({ success: false, message });
      }
      next(error);
    }
  };
};
